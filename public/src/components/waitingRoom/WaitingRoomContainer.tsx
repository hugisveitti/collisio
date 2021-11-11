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
import { toast } from "react-toastify";
import { Socket } from "socket.io-client";
import { IPlayerConnection } from "../../classes/Game";
import AppContainer from "../../containers/AppContainer";
import { inputBackgroundColor } from "../../providers/theme";
import { UserContext } from "../../providers/UserProvider";
import { ISocketCallback } from "../../utils/connectSocket";
import { getDeviceType, inTestMode, isIphone } from "../../utils/settings";
import LoginComponent from "../LoginComponent";
import { frontPagePath, controlsRoomPath } from "../Routes";
import { IStore } from "../store";
import WaitingRoomComponent from "./WaitingRoomComponent";
import "../../styles/main.css";
import {
  addToAvailableRooms,
  removeFromAvailableRooms,
} from "../../firebase/firebaseFunctions";
import { sendPlayerInfoChanged } from "../../utils/socketFunctions";
import DeviceOrientationPermissionComponent from "./DeviceOrientationPermissionComponent";
import BasicModal from "../modal/BasicModal";
import { IPlayerInfo } from "../../shared-backend/shared-stuff";

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
      photoURL: user?.photoURL,
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
    const userLoadingTimout = setTimeout(() => {
      /** TODO: do this */
      setUserLoading(false);
    }, 1000);

    props.socket.on("waiting-room-alert", ({ players: _players }) => {
      props.store.setPlayers(_players);
    });

    props.socket.emit("in-waiting-room");
    if (onMobile) {
      props.socket.once("handle-game-starting", () => {
        history.push(controlsRoomPath);
      });

      getPlayersInRoom();
      props.socket.on("game-settings-changed", (data) => {
        props.store.setPreGameSettings(data.gameSettings);
      });

      props.socket.on("game-disconnected", () => {
        console.log("game disconnected was called");
        toast.error("Game disconnected");
        /** go to front page? */
      });
    } else {
      props.socket.on("player-disconnected", ({ playerName }) => {
        toast.warn(`${playerName} disconnected from waiting room`);
      });
    }

    return () => {
      window.clearTimeout(userLoadingTimout);
      props.socket.emit("left-waiting-room", {});
      props.socket.off("game-settings-changed");
      props.socket.off("waiting-room-alert");
      props.socket.off("player-disconnected");
      props.socket.off("get-players-in-room-callback");
      props.socket.off("player-connected-callback");
    };
  }, []);

  useEffect(() => {
    if (props.store.userSettings && props.store.player) {
      /** maybe need some more efficient way to use save data */
      const newPlayer: IPlayerInfo = {
        ...props.store.player,
        vehicleType: props.store.userSettings.vehicleSettings.vehicleType,
      };

      props.store.setPlayer(newPlayer);
      sendPlayerInfoChanged(props.socket, newPlayer);
    }

    if (props.store.userSettings.preGameSettings && !onMobile) {
      props.store.setPreGameSettings(props.store.userSettings.preGameSettings);
    }
  }, [props.store.userSettings]);

  useEffect(() => {
    if (!onMobile && user && props.store.roomId) {
      addToAvailableRooms(user.uid, {
        roomId: props.store.roomId,
        displayName: user.displayName,
      });
    }
    window.onbeforeunload = () => {
      if (user && !onMobile) {
        removeFromAvailableRooms(user.uid);
      }
    };

    return () => {
      if (user && !onMobile) {
        removeFromAvailableRooms(user.uid);
      }
    };
  }, [user?.uid]);

  const renderDisplayNameModal = () => {
    if (userLoading) return null;
    return (
      <BasicModal
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
                  setShowLoginInComponent(true);
                }}
              >
                Login
              </Button>
            </Grid>
          )}
        </Grid>
      </BasicModal>
    );
  };

  /** usering loading be */
  if (!onMobile && !props.store.roomId && !inTestMode) {
    history.push(frontPagePath);
    return null;
  }

  return (
    <AppContainer>
      <div className="container">
        {renderDisplayNameModal()}
        {onMobile && !props.store.player ? (
          <div
            className="container"
            style={{ marginTop: 75, textAlign: "center", margin: "auto" }}
          >
            <CircularProgress />
          </div>
        ) : (
          <React.Fragment>
            <WaitingRoomComponent
              socket={props.socket}
              store={props.store}
              user={user}
              roomId={roomId}
            />
          </React.Fragment>
        )}
      </div>
      <DeviceOrientationPermissionComponent
        onMobile={onMobile}
        onIphone={isIphone()}
      />
    </AppContainer>
  );
};

export default WaitingRoomContainer;
