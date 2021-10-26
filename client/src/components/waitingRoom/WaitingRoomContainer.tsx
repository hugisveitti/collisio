import { LoadingButton } from "@mui/lab";
import {
  Button,
  CircularProgress,
  Grid,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import { useHistory, useParams } from "react-router";
import { toast, ToastContainer } from "react-toastify";
import { Socket } from "socket.io-client";
import { IPlayerConnection } from "../../classes/Game";
import AppContainer from "../../containers/AppContainer";
import { inputBackgroundColor } from "../../providers/theme";
import { UserContext } from "../../providers/UserProvider";
import { ISocketCallback } from "../../utils/connectSocket";
import { requestDeviceOrientation } from "../../utils/ControlsClasses";
import { getDeviceType } from "../../utils/settings";
import LoginComponent from "../LoginComponent";
import { frontPagePath, controlsRoomPath } from "../Routes";
import { IStore } from "../store";
import WaitingRoomComponent from "./WaitingRoomComponent";
import "../../styles/main.css";

interface WaitParamType {
  roomId: string;
}

interface IWaitingRoomProps {
  socket: Socket;
  store: IStore;
}
interface WaitParamType {
  roomId: string;
}

const WaitingRoomContainer = (props: IWaitingRoomProps) => {
  const [userLoading, setUserLoading] = useState(true);
  const [displayNameModalOpen, setDisplayNameModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [connectingGuest, setConnectingGuest] = useState(false);
  const [showLoginInComponent, setShowLoginInComponent] = useState(false);

  const user = useContext(UserContext);

  const onMobile = getDeviceType() === "mobile";
  const history = useHistory();
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
      isAuthenticated: Boolean(user),
      photoURL: user.photoURL,
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
          //   toast.error(response.message);
          setConnectingGuest(false);
          history.push(frontPagePath);
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
    }
    return () => {
      props.socket.off("game-settings-changed");
      props.socket.off("player-joined");
      props.socket.off("player-disconnected");
      props.socket.off("get-players-in-room-callback");
      props.socket.off("player-connected-callback");
    };
  }, []);

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

  return (
    <AppContainer>
      <div className="container">
        {onMobile && !props.store.player ? (
          <div
            className="container"
            style={{ marginTop: 75, textAlign: "center", margin: "auto" }}
          >
            <CircularProgress />
          </div>
        ) : (
          <React.Fragment>
            {renderDisplayNameModal()}
            <WaitingRoomComponent
              socket={props.socket}
              store={props.store}
              user={user}
              roomId={roomId}
            />
          </React.Fragment>
        )}
      </div>
      <ToastContainer />
    </AppContainer>
  );
};

export default WaitingRoomContainer;
