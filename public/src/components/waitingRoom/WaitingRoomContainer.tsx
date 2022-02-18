import CircularProgress from "@mui/material/CircularProgress";
import React, { useContext, useEffect } from "react";
import { useHistory, useParams } from "react-router";
import { toast } from "react-toastify";
import { IRoomInfo } from "../../classes/Game";
import {
  IGameSettings,
  setLocalGameSetting,
} from "../../classes/localGameSettings";
import { getLocalUid, saveLocalStorageItem } from "../../classes/localStorage";
import {
  addToAvailableRooms,
  removeFromAvailableRooms,
  saveRoom,
} from "../../firebase/firestoreFunctions";
import { UserContext } from "../../providers/UserProvider";
import {
  IPlayerInfo,
  mdts_left_waiting_room,
  mdts_players_in_room,
  mts_connected_to_waiting_room,
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
import {
  disconnectSocket,
  getSocket,
  ISocketCallback,
} from "../../utils/connectSocket";
import { getDeviceType, inTestMode, isIphone } from "../../utils/settings";
import { getDateNow } from "../../utils/utilFunctions";
import BackdropContainer from "../backdrop/BackdropContainer";
import {
  connectPagePath,
  frontPagePath,
  gameRoomPath,
  getConnectPagePath,
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

const WaitingRoomContainer = (props: IWaitingRoomProps) => {
  const user = useContext(UserContext);
  const onMobile = getDeviceType() === "mobile";
  const history = useHistory();
  const params = useParams<WaitParamType>();
  const roomId = params?.roomId;

  const socket = getSocket();
  // have to have socket to get in

  const handleSaveRoomInfo = () => {
    if (toSaveRoomId) {
      const roomInfo: IRoomInfo = {
        desktopId: user?.uid ?? getLocalUid(),
        desktopAuthenticated: !!user,
        roomId: toSaveRoomId,
        gameSettings: toSaveGameSettings as IGameSettings,
        players: toSavePlayers.map(playerInfoToPreGamePlayerInfo),
        date: getDateNow(),
        canceledGame: false,
      };
      saveRoom(roomInfo);
    }
  };

  const getPlayersInRoom = () => {
    socket.emit(mdts_players_in_room, { roomId });
    socket.once(stmd_players_in_room_callback, (response: ISocketCallback) => {
      if (response.status === "error") {
        toast.error(response.message);
      } else {
        props.store.setPlayers(response.data.players);
      }
    });
  };

  useEffect(() => {
    console.log("socket", socket);
    if (!socket?.connected && !inTestMode) {
      let path = roomId ? getConnectPagePath(roomId) : connectPagePath;
      history.push(path);
      return null;
    }
    // TODO: create a function that verifies gameSettings
    if (onMobile) {
      saveLocalStorageItem("roomId", roomId.toLowerCase());
    }

    if (!socket && !onMobile && !inTestMode) {
      /** Desktops should always have a socket when connected to waiting room */

      history.push(frontPagePath);
    }

    return () => {
      if (!onMobile) {
        /** save on unmount only if no gameRoom */

        handleSaveRoomInfo();
      }
      props.store.setPreviousPage(waitingRoomPath);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    toSaveGameSettings = props.store.gameSettings;
    /**
     * if desktop goes in and out and in of waitingRoom
     */
    if (!inTestMode) {
      props.store.setPlayers([]);
    }

    socket.on(stmd_waiting_room_alert, ({ players: _players }) => {
      props.store.setPlayers(_players);
      toSavePlayers = _players;
    });

    socket.on(stmd_game_starting, () => {
      if (onMobile) {
        history.push(getControlsRoomPath(roomId));
      } else {
        history.push(gameRoomPath);
      }
    });

    if (onMobile) {
      socket.emit(mts_connected_to_waiting_room);

      socket.on(stm_player_info, (res) => {
        const { player } = res;
        if (player) {
          props.store.setPlayer(player);
        }
      });

      getPlayersInRoom();
      socket.on(stmd_game_settings_changed, (data) => {
        toSaveGameSettings = data.gameSettings;
        for (let key of Object.keys(data.gameSettings)) {
          // @ts-ignore
          setLocalGameSetting(key, data.gameSettings[key]);
        }
        props.store.setGameSettings(data.gameSettings);
      });

      socket.on(stm_desktop_disconnected, () => {
        console.log("desktop disconnected");
        toast.error("Game disconnected");
        disconnectSocket();
        history.push(frontPagePath);
        /** go to front page? */
      });
    } else {
      socket.on(std_player_disconnected, ({ playerName }) => {
        toast.warn(`${playerName} disconnected from waiting room`);
      });
    }

    return () => {
      console.log("removing all socket listeners");
      socket?.emit(mdts_left_waiting_room, {});
      socket.off(stmd_game_starting);
      socket.off(stm_desktop_disconnected);
      socket.off(stmd_game_settings_changed);
      socket.off(stmd_waiting_room_alert);
      socket.off(std_player_disconnected);
      socket.off(stmd_players_in_room_callback);
      socket.off(stm_player_connected_callback);
      socket.off(stm_player_info);
    };
  }, []);

  useEffect(() => {
    if (props.store.userSettings && props.store.player && !inTestMode) {
      /** maybe need some more efficient way to use save data */
      const newPlayer: IPlayerInfo = {
        ...props.store.player,
        vehicleType: props.store.userSettings.vehicleSettings.vehicleType,
      };

      props.store.setPlayer(newPlayer);
      socket?.emit("player-info-changed", newPlayer);
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

  if (!onMobile && !props.store.roomId && !inTestMode) {
    history.push(frontPagePath);
    return null;
  }

  return (
    <BackdropContainer
      store={props.store}
      backgroundContainer
      loading={!socket}
    >
      <React.Fragment>
        {(onMobile && !props.store.player) || !socket?.connected ? (
          <div
            className="container"
            style={{ marginTop: 75, textAlign: "center", margin: "auto" }}
          >
            <CircularProgress />
          </div>
        ) : (
          <React.Fragment>
            <WaitingRoomComponent
              socket={socket}
              store={props.store}
              user={user}
              roomId={roomId}
            />
          </React.Fragment>
        )}

        <DeviceOrientationPermissionComponent
          onMobile={onMobile}
          onIphone={isIphone()}
        />
      </React.Fragment>
    </BackdropContainer>
  );
};

export default WaitingRoomContainer;
