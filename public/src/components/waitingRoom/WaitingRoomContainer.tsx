import { LoadingButton } from "@mui/lab";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router";
import { toast } from "react-toastify";
import { v4 as uuid } from "uuid";
import { IPlayerConnection, IRoomInfo } from "../../classes/Game";
import {
  IGameSettings,
  setLocalGameSetting,
} from "../../classes/localGameSettings";
import { saveLocalStorageItem } from "../../classes/localStorage";
import AppContainer from "../../containers/AppContainer";
import {
  addToAvailableRooms,
  removeFromAvailableRooms,
  saveRoom,
} from "../../firebase/firestoreFunctions";
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
  stm_player_info,
} from "../../shared-backend/shared-stuff";
import "../../styles/main.css";
import { createSocket, ISocketCallback } from "../../utils/connectSocket";
import { getDeviceType, inTestMode, isIphone } from "../../utils/settings";
import { sendPlayerInfoChanged } from "../../utils/socketFunctions";
import { getDateNow } from "../../utils/utilFunctions";
import LoginComponent from "../LoginComponent";
import {
  frontPagePath,
  gameRoomPath,
  getControlsRoomPath,
  waitingRoomPath,
} from "../Routes";
import { IStore } from "../store";
import DeviceOrientationPermissionComponent from "./DeviceOrientationPermissionComponent";
import WaitingRoomComponent from "./WaitingRoomComponent";

interface IWaitingRoomProps {
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

// window.addEventListener(
//   "beforeunload",
//   () => {
//     console.log("unload");
//     alert("unload");
//   },
//   true
// );

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

  /**
   * this suddenly doesnt work...
   */
  // window.addEventListener("beforeunload", (ev) => {
  //   ev.preventDefault();
  //   console.log("unload");
  //   alert("unload");
  //   if (user && !onMobile) {
  //     removeFromAvailableRooms(user.uid);
  //   }
  //   //ev.returnValue = null;
  //   return ""; //((ev.returnValue = null));
  // });

  const handleSaveRoomInfo = () => {
    if (toSaveRoomId) {
      const roomInfo: IRoomInfo = {
        desktopId: user?.uid ?? "undefined",
        desktopAuthenticated: !!user,
        roomId: toSaveRoomId,
        gameSettings: toSaveGameSettings as IGameSettings,
        players: toSavePlayers.map(playerInfoToPreGamePlayerInfo),
        date: getDateNow(),
        canceledGame: history.location?.pathname !== gameRoomPath,
      };
      saveRoom(roomInfo);
    }
  };

  const getPlayersInRoom = () => {
    props.store.socket.emit(mdts_players_in_room, { roomId });
    props.store.socket.once(
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
    props.store.socket.emit(mts_player_connected, {
      roomId,
      playerName: _displayName,
      playerId: user?.uid ?? uuid(),
      isAuthenticated: Boolean(user),
      photoURL: user?.photoURL,
    } as IPlayerConnection);
    props.store.socket.once(
      stm_player_connected_callback,
      (response: ISocketCallback) => {
        if (response.status === "success") {
          props.store.setPlayer(response.data.player);
          props.store.setRoomId(roomId);
          props.store.setGameSettings(response.data.gameSettings);
          props.store.setPlayers(response.data.players);
          setConnectingGuest(false);
          //  toast.success(response.message);
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

    if (!user && !props.store.player && !props.store.socket) {
      createSocket(getDeviceType(), (_socket) => {
        props.store.setSocket(_socket);
        setDisplayNameModalOpen(true);
      });
    } else if (props.store.socket) {
      if (!props.store.player) {
        /** if gotten here through url */
        /** shouldnt we catch this in the connect to room container */
        connectToRoom(
          user?.displayName ?? "Guest" + Math.floor(Math.random() * 20)
        );
      }

      setDisplayNameModalOpen(false);
    }
  }, [user]);

  useEffect(() => {
    // TODO: create a function that verifies gameSettings
    if (onMobile) {
      saveLocalStorageItem("roomId", roomId.toLowerCase());
    }

    if (!props.store.socket && !onMobile && !inTestMode) {
      /** Desktops should always have a socket when connected to waiting room */

      history.push(frontPagePath);
    }

    return () => {
      if (!onMobile) {
        /** save on unmount only if no gameRoom */

        handleSaveRoomInfo();
      }
      console.log("waiting room container closing");
      props.store.setPreviousPage(waitingRoomPath);
    };
  }, []);

  useEffect(() => {
    if (!props.store.socket) return;
    toSaveGameSettings = props.store.gameSettings;
    /**
     * if desktop goes in and out and in of waitingRoom
     */
    if (!inTestMode) {
      props.store.setPlayers([]);
    }

    const userLoadingTimout = setTimeout(() => {
      /** TODO: do this */
      setUserLoading(false);
    }, 1000);

    props.store.socket.on(stmd_waiting_room_alert, ({ players: _players }) => {
      props.store.setPlayers(_players);
      toSavePlayers = _players;
    });

    props.store.socket.on(stmd_game_starting, () => {
      if (onMobile) {
        history.push(getControlsRoomPath(roomId));
      } else {
        history.push(gameRoomPath);
      }
    });

    if (onMobile) {
      props.store.socket.emit(mts_connected_to_waiting_room);

      props.store.socket.on(stm_player_info, (res) => {
        const { player } = res;
        if (player) {
          props.store.setPlayer(player);
        }
      });

      getPlayersInRoom();
      props.store.socket.on(stmd_game_settings_changed, (data) => {
        toSaveGameSettings = data.gameSettings;
        for (let key of Object.keys(data.gameSettings)) {
          // @ts-ignore
          setLocalGameSetting(key, data.gameSettings[key]);
        }
        props.store.setGameSettings(data.gameSettings);
      });

      props.store.socket.on(stm_desktop_disconnected, () => {
        toast.error("Game disconnected");
        history.push(frontPagePath);
        /** go to front page? */
      });
    } else {
      props.store.socket.on(std_player_disconnected, ({ playerName }) => {
        toast.warn(`${playerName} disconnected from waiting room`);
      });
    }

    return () => {
      window.clearTimeout(userLoadingTimout);
      props.store.socket.emit(mdts_left_waiting_room, {});
      props.store.socket.off(stmd_game_starting);
      props.store.socket.off(stm_desktop_disconnected);
      props.store.socket.off(stmd_game_settings_changed);
      props.store.socket.off(stmd_waiting_room_alert);
      props.store.socket.off(std_player_disconnected);
      props.store.socket.off(stmd_players_in_room_callback);
      props.store.socket.off(stm_player_connected_callback);
      props.store.socket.off(stm_player_info);
    };
  }, [props.store.socket]);

  useEffect(() => {
    if (props.store.userSettings && props.store.player && !inTestMode) {
      /** maybe need some more efficient way to use save data */
      const newPlayer: IPlayerInfo = {
        ...props.store.player,
        vehicleType: props.store.userSettings.vehicleSettings.vehicleType,
      };

      props.store.setPlayer(newPlayer);
      sendPlayerInfoChanged(props.store.socket, newPlayer);
    }
  }, [props.store.userSettings]);

  useEffect(() => {
    if (props.store.gameSettings && !onMobile) {
      props.store.setGameSettings(props.store.gameSettings);
    }
  }, [props.store.gameSettings]);

  useEffect(() => {
    if (!onMobile && props.store.roomId) {
      toSaveRoomId = props.store.roomId ?? roomId;
      if (user) {
        addToAvailableRooms(user.uid, {
          roomId: props.store.roomId,
          displayName: user.displayName,
          userId: user.uid,
        });
      }
    }

    return () => {
      if (user && !onMobile) {
        removeFromAvailableRooms(user.uid);
      }
    };
  }, [user]);

  const renderDisplayNameModal = () => {
    if (userLoading) return null;
    return (
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
              let _displayName = displayName;
              if (displayName === "") {
                _displayName = "Clown-" + (Math.random() * 1000).toFixed(0);
                setDisplayName(_displayName);
              }
              setShowLoginInComponent(false);
              connectToRoom(_displayName);
              setDisplayNameModalOpen(false);
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
    );
  };

  /** usering loading be */
  if (!onMobile && !props.store.roomId && !inTestMode) {
    history.push(frontPagePath);
    return null;
  }

  return (
    <AppContainer loading={!props.store.socket}>
      <React.Fragment>
        {displayNameModalOpen ? (
          renderDisplayNameModal()
        ) : (
          <>
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
                  socket={props.store.socket}
                  store={props.store}
                  user={user}
                  roomId={roomId}
                />
              </React.Fragment>
            )}
          </>
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
