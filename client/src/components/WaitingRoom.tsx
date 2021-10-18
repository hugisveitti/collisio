import {
  Button,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import LoadingButton from "@mui/lab/LoadingButton";
import { useHistory } from "react-router";
import QRCode from "qrcode";
import { Link, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Socket } from "socket.io-client";
import { IPlayerInfo } from "../classes/Game";
import { UserContext } from "../providers/UserProvider";
import "../styles/main.css";
import { ISocketCallback } from "../utils/connectSocket";
import { getDeviceType, startGameAuto } from "../utils/settings";
import { controlsRoomPath, frontPagePath, gameRoomPath } from "./Routes";
import { IStore } from "./store";
import GameSettingsComponent from "./GameSettingsComponent";
import AppContainer from "../containers/AppContainer";

interface IWaitingRoomProps {
  socket: Socket;
  store: IStore;
}

interface WaitParamType {
  roomId: string;
}

const WaitingRoom = (props: IWaitingRoomProps) => {
  const history = useHistory();
  const [userLoading, setUserLoading] = useState(true);
  const [displayNameModalOpen, setDisplayNameModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [connectingGuest, setConnectingGuest] = useState(false);
  const [roomQrCode, setRoomQrCode] = useState("");

  const onMobile = getDeviceType() === "mobile";
  const user = useContext(UserContext);

  const params = useParams<WaitParamType>();
  const roomId = params?.roomId;

  if (!onMobile && !props.store.roomId) {
    history.push(frontPagePath);
    return null;
  }

  const getPlayersInRoom = () => {
    props.socket.emit("get-players-in-room", { roomId });
    props.socket.once(
      "get-players-in-room-callback",
      (response: ISocketCallback) => {
        if (response.status === "error") {
          toast.error(response.message);
        } else {
          props.store.setPlayers(response.data.players);
        }
      }
    );
  };

  const connectToRoom = (_displayName: string) => {
    setConnectingGuest(true);
    props.socket.emit("player-connected", {
      roomId,
      playerName: _displayName,
      id: undefined,
    });
    props.socket.once(
      "player-connected-callback",
      (response: ISocketCallback) => {
        if (response.status === "success") {
          props.store.setPlayer(response.data.player);
          props.store.setRoomId(roomId);
          props.store.setPlayers(response.data.players);
          setConnectingGuest(false);

          setDisplayNameModalOpen(false);
        } else {
          toast.error(response.message);
          setConnectingGuest(false);
        }
      }
    );
  };

  useEffect(() => {
    if (!onMobile) return;

    if (!user && !props.store.player) {
      setDisplayNameModalOpen(true);
    } else {
      if (!props.store.player) {
        connectToRoom(user.displayName);
      }
      setDisplayNameModalOpen(false);
    }
  }, [user]);

  useEffect(() => {
    setTimeout(() => {
      setUserLoading(false);
    }, 1000);

    props.socket.on("player-joined", ({ players: _players }) => {
      props.store.setPlayers(_players);
    });

    props.socket.emit("in-waiting-room");
    if (onMobile) {
      props.socket.once("handle-game-starting", () => {
        history.push(controlsRoomPath);
      });

      getPlayersInRoom();
      props.socket.on("game-settings-changed", (data) => {
        console.log("game settings changed");
        props.store.setGameSettings(data.gameSettings);
      });
    } else {
      props.socket.on("player-disconnected", ({ playerName }) => {
        toast.warn(`${playerName} disconnected from waiting room`);
      });

      // only generate qr code on desktop
      QRCode.toDataURL(window.location.href)
        .then((url) => {
          setRoomQrCode(url);
        })
        .catch((err) => {
          console.log("error generating qr code", err);
        });
    }
    return () => {
      props.socket.off("player-disconnected");
    };
  }, []);

  const sendTeamChange = (newTeamNumber: number) => {
    props.socket.emit("team-change", { newTeamNumber });
  };

  const handleStartGame = () => {
    props.socket.emit("handle-start-game");
    props.socket.once("handle-start-game-callback", (data: ISocketCallback) => {
      if (data.status === "success") {
        history.push(gameRoomPath);
      } else {
        toast.error(data.message);
      }
    });
  };

  useEffect(() => {
    /***** For development */
    if (startGameAuto) {
      if (props.store.players.length > 0) {
        handleStartGame();
      }
    }
    /****** */
  }, [props.store.players]);

  const renderDisplayNameModal = () => {
    if (userLoading) return null;
    return (
      <Modal
        open={displayNameModalOpen}
        onClose={() => {
          let _displayName = displayName;
          if (displayName === "") {
            _displayName = "Clown-" + (Math.random() * 1000).toFixed(0);
            setDisplayName(_displayName);
          }
          setDisplayNameModalOpen(false);
          connectToRoom(_displayName);
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "75%",
            backgroundColor: "#eeebdf",
            border: "2px solid #000",
            padding: 10,
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography>
                You are not logged in, please type in your name or log in.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <LoadingButton
                loading={connectingGuest}
                variant="outlined"
                onClick={() => connectToRoom(displayName)}
              >
                Submit
              </LoadingButton>
            </Grid>
            <Grid item xs={6}>
              <Button variant="contained">Login</Button>
            </Grid>
          </Grid>
        </div>
      </Modal>
    );
  };

  const renderTeamSelect = (player: IPlayerInfo, i: number) => {
    if (props.store.gameSettings.typeOfGame !== "ball") return null;
    if (onMobile && props.store.player?.playerNumber === player.playerNumber) {
      return (
        <div className="team-select-container">
          <label className="team-select-radio-button">
            <input
              type="radio"
              id="team0"
              name={`team-pick-${i}`}
              value={0}
              checked={player.teamNumber === 0}
              onChange={() => {
                sendTeamChange(0);
              }}
            />
            Team 0
          </label>
          <label className="team-select-radio-button">
            <input
              type="radio"
              id="team1"
              name={`team-pick-${i}`}
              value={1}
              checked={player.teamNumber === 1}
              onChange={() => {
                sendTeamChange(1);
              }}
            />
            Team 1
          </label>
        </div>
      );
    }
    return (
      <span className="team-select-container">TEAM: {player.teamNumber}</span>
    );
  };

  return (
    <AppContainer>
      {renderDisplayNameModal()}
      <div className="container">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <h1 className="center">Waiting room</h1>
          </Grid>
          <Grid item xs={12}>
            <h3>{roomId}</h3>
          </Grid>
          <Grid item xs={12}>
            <Link to={frontPagePath}>Back to front page</Link>
          </Grid>
          <Grid item xs={12}>
            <Typography component="span">
              Link to room: {window.location.href}
            </Typography>{" "}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied!");
              }}
            >
              Copy
            </button>
          </Grid>
          {roomQrCode && (
            <Grid item xs={12}>
              <img src={roomQrCode} alt="" />
            </Grid>
          )}

          <Grid item xs={12}>
            <Typography>
              On your mobile, either scan the QR code, copy the link to room and
              paste it in your phone or write the room id '{roomId}' in input on
              the front page.
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <h3 className="center">Players in room {props.store.roomId}</h3>
          </Grid>
          <Grid item xs={false} sm={3} />
          {props.store.players.length > 0 ? (
            <Grid item xs={12} sm={6}>
              <List
                style={{
                  backgroundColor: "wheat",
                }}
              >
                {props.store.players.map((player: IPlayerInfo, i: number) => {
                  return (
                    <React.Fragment key={player.playerName}>
                      <ListItem>
                        <ListItemText
                          primary={
                            player.playerNumber ===
                            props.store.player?.playerNumber ? (
                              <strong>{player.playerName}</strong>
                            ) : (
                              player.playerName
                            )
                          }
                        />
                        {renderTeamSelect(player, i)}
                      </ListItem>
                      {i !== props.store.players.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>
            </Grid>
          ) : (
            <Grid item xs={12} sm={6}>
              <Typography
                style={{
                  backgroundColor: "wheat",
                }}
              >
                No players connected
              </Typography>
            </Grid>
          )}
          <Grid item xs={false} sm={3} />

          {!onMobile && (
            <React.Fragment>
              <Grid item xs={12}>
                <Button variant="contained" onClick={handleStartGame}>
                  Start game
                </Button>
              </Grid>
              <Divider variant="middle" style={{ margin: 15 }} />
              <GameSettingsComponent
                socket={props.socket}
                store={props.store}
              />
            </React.Fragment>
          )}
        </Grid>
      </div>
      <ToastContainer />
    </AppContainer>
  );
};

export default WaitingRoom;
