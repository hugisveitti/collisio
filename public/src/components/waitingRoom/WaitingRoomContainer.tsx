import { LoadingButton } from "@mui/lab";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router";
import { toast } from "react-toastify";
import { Socket } from "socket.io-client";
import { v4 as uuid } from "uuid";
import { IPlayerConnection, IRoomInfo } from "../../classes/Game";
import { IGameSettings } from "../../classes/localGameSettings";
import AppContainer from "../../containers/AppContainer";
import {
  addToAvailableRooms,
  removeFromAvailableRooms,
  saveRoom,
} from "../../firebase/firebaseFunctions";
import { inputBackgroundColor } from "../../providers/theme";
import { UserContext } from "../../providers/UserProvider";
import {
  IPlayerInfo,
  mdts_left_waiting_room,
  mdts_players_in_room,
  mts_connected_to_waiting_room,
  mts_player_connected,
  playerInfoToPreGamePlayerInfo,
  std_player_disconnected,
  stmd_game_settings_changed,
  stmd_game_starting,
  stmd_players_in_room_callback,
  stmd_waiting_room_alert,
  stm_desktop_disconnected,
  stm_player_connected_callback,
} from "../../shared-backend/shared-stuff";
import "../../styles/main.css";
import { ISocketCallback } from "../../utils/connectSocket";
import { getDeviceType, inTestMode, isIphone } from "../../utils/settings";
import { sendPlayerInfoChanged } from "../../utils/socketFunctions";
import { getDateNow } from "../../utils/utilFunctions";
import LoginComponent from "../LoginComponent";
import BasicModal from "../modal/BasicModal";
import { controlsRoomPath, frontPagePath, gameRoomPath } from "../Routes";
import { IStore } from "../store";
import DeviceOrientationPermissionComponent from "./DeviceOrientationPermissionComponent";
import WaitingRoomComponent from "./WaitingRoomComponent";

interface IWaitingRoomProps {
  socket: Socket;
  store: IStore;
}
interface WaitParamType {
  roomId: string;
}

/**
 * a small hack
 * since variables created with useState behave weird with useEffect
 */
let toSavePlayers = [];
let toSaveRoomId = "";
let toSaveGameSettings = {};

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

  const handleSaveRoomInfo = () => {
    if (toSaveRoomId) {
      const roomInfo: IRoomInfo = {
        desktopId: user?.uid,
        desktopAuthenticated: !!user,
        roomId: toSaveRoomId,
        gameSettings: toSaveGameSettings as IGameSettings,
        players: toSavePlayers.map(playerInfoToPreGamePlayerInfo),
        date: getDateNow(),
        canceledGame: history.location?.pathname !== gameRoomPath,
      };
      saveRoom(toSaveRoomId, roomInfo);
    }
  };

  const getPlayersInRoom = () => {
    props.socket.emit(mdts_players_in_room, { roomId });
    props.socket.once(
      stmd_players_in_room_callback,
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
    props.socket.emit(mts_player_connected, {
      roomId,
      playerName: _displayName,
      playerId: user?.uid ?? uuid(),
      isAuthenticated: Boolean(user),
      photoURL: user?.photoURL,
    } as IPlayerConnection);
    props.socket.once(
      stm_player_connected_callback,
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
        /** if gotten here through url */

        connectToRoom(user.displayName);
      }
      setDisplayNameModalOpen(false);
    }
  }, [user]);

  useEffect(() => {
    toSaveGameSettings = props.store.gameSettings;
    /**
     * if desktop goes in and out and in of waitingRoom
     */

    props.store.setPlayers([]);

    const userLoadingTimout = setTimeout(() => {
      /** TODO: do this */
      setUserLoading(false);
    }, 1000);

    props.socket.on(stmd_waiting_room_alert, ({ players: _players }) => {
      props.store.setPlayers(_players);
      toSavePlayers = _players;
    });

    props.socket.on(stmd_game_starting, () => {
      if (onMobile) {
        history.push(controlsRoomPath);
      } else {
        history.push(gameRoomPath);
      }
    });

    if (onMobile) {
      props.socket.emit(mts_connected_to_waiting_room);

      getPlayersInRoom();
      props.socket.on(stmd_game_settings_changed, (data) => {
        toSaveGameSettings = data.gameSettings;
        props.store.setGameSettings(data.gameSettings);
      });

      props.socket.on(stm_desktop_disconnected, () => {
        toast.error("Game disconnected");
        history.push(frontPagePath);
        /** go to front page? */
      });
    } else {
      props.socket.on(std_player_disconnected, ({ playerName }) => {
        toast.warn(`${playerName} disconnected from waiting room`);
      });
    }

    return () => {
      if (!onMobile) {
        /** save on unmount only if no gameRoom */
        handleSaveRoomInfo();
      }
      window.clearTimeout(userLoadingTimout);
      props.socket.emit(mdts_left_waiting_room, {});
      props.socket.off(stmd_game_starting);
      props.socket.off(stm_desktop_disconnected);
      props.socket.off(stmd_game_settings_changed);
      props.socket.off(stmd_waiting_room_alert);
      props.socket.off(std_player_disconnected);
      props.socket.off(stmd_players_in_room_callback);
      props.socket.off(stm_player_connected_callback);
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
  }, [props.store.userSettings]);

  useEffect(() => {
    if (props.store.gameSettings && !onMobile) {
      props.store.setGameSettings(props.store.gameSettings);
    }
  }, [props.store.gameSettings]);

  useEffect(() => {
    if (!onMobile && user && props.store.roomId) {
      toSaveRoomId = props.store.roomId;
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
              disableElevation
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
              <LoginComponent
                onClose={() => setShowLoginInComponent(false)}
                signInWithPopup={false}
              />
            </Grid>
          ) : (
            <Grid item xs={6}>
              <Button
                disableElevation
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
      <React.Fragment>
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
      </React.Fragment>
      <DeviceOrientationPermissionComponent
        onMobile={onMobile}
        onIphone={isIphone()}
      />
    </AppContainer>
  );
};

export default WaitingRoomContainer;
