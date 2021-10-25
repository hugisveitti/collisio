import LoadingButton from "@mui/lab/LoadingButton";
import {
  Button,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Modal,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import QRCode from "qrcode";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import HelpIcon from "@mui/icons-material/Help";
import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { Link, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Socket } from "socket.io-client";
import { v4 as uuid } from "uuid";
import { IPlayerConnection, IPlayerInfo } from "../classes/Game";
import AppContainer from "../containers/AppContainer";
import { inputBackgroundColor } from "../providers/theme";
import { UserContext } from "../providers/UserProvider";
import "../styles/main.css";
import { ISocketCallback } from "../utils/connectSocket";
import { requestDeviceOrientation } from "../utils/ControlsClasses";
import { getDeviceType, isIphone, startGameAuto } from "../utils/settings";
import GameSettingsComponent from "./GameSettingsComponent";
import LoginComponent from "./LoginComponent";
import { controlsRoomPath, frontPagePath, gameRoomPath } from "./Routes";
import { IStore } from "./store";

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
  const [showLoginInComponent, setShowLoginInComponent] = useState(false);
  const [copyTooltipOpen, setCopyTooltipOpen] = useState(false);

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
      playerId: user?.uid ?? uuid(),
      isAuthenticated: false,
    } as IPlayerConnection);
    props.socket.once(
      "player-connected-callback",
      (response: ISocketCallback) => {
        if (response.status === "success") {
          props.store.setPlayer(response.data.player);
          props.store.setRoomId(roomId);
          props.store.setPlayers(response.data.players);
          setConnectingGuest(false);
          toast.success(response.message);
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
          setShowLoginInComponent(false);
          requestDeviceOrientation();
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
                style={{
                  backgroundColor: inputBackgroundColor,
                }}
                label="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <LoadingButton
                loading={connectingGuest}
                variant="outlined"
                onClick={() => {
                  requestDeviceOrientation();
                  connectToRoom(displayName);
                }}
              >
                Submit
              </LoadingButton>
            </Grid>
            {showLoginInComponent ? (
              <Grid item xs={12}>
                <LoginComponent signInWithPopup={false} />
              </Grid>
            ) : (
              <Grid item xs={6}>
                <Button
                  variant="contained"
                  onClick={() => {
                    requestDeviceOrientation();
                    setShowLoginInComponent(true);
                  }}
                >
                  Login
                </Button>
              </Grid>
            )}
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
            <Tooltip
              title="Link copied!"
              open={copyTooltipOpen}
              disableFocusListener
              disableHoverListener
              disableTouchListener
              onClose={() => setCopyTooltipOpen(false)}
            >
              <IconButton
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopyTooltipOpen(true);
                  setTimeout(() => {
                    setCopyTooltipOpen(false);
                  }, 2000);
                }}
              >
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
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
            <Typography color="textSecondary">
              You can press 'r' to reset the game and 'p' to pause and unpause
              the game.
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <h3 className="center">Players in room {props.store.roomId}</h3>
          </Grid>

          <React.Fragment>
            <Grid item xs={1} sm={3} />
            {props.store.players.length > 0 ? (
              <Grid item xs={10} sm={6}>
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
              <Grid item xs={10} sm={6}>
                <Typography
                  style={{
                    backgroundColor: "wheat",
                  }}
                >
                  No players connected
                </Typography>
              </Grid>
            )}
            <Grid item xs={1} sm={3} />
          </React.Fragment>

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

          {onMobile && isIphone() && (
            <React.Fragment>
              <Grid item xs={6} sm={6}>
                <Tooltip
                  disableFocusListener
                  title="To activate the device orientation on iphone the user sometimes needs to press a button to request it. For development purposes this button is here."
                >
                  <Button startIcon={<HelpIcon />}>What is this</Button>
                </Tooltip>
              </Grid>
              <Grid item xs={6} sm={6}>
                <Button
                  variant="outlined"
                  onClick={() => requestDeviceOrientation()}
                >
                  Request device orientation
                </Button>
              </Grid>
            </React.Fragment>
          )}
        </Grid>
      </div>
      <ToastContainer />
    </AppContainer>
  );
};

export default WaitingRoom;
