import SettingsIcon from "@mui/icons-material/Settings";
import IconButton from "@mui/material/IconButton";
import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router";
import { IGameSettings, IRoomSettings } from "../../classes/localGameSettings";
import {
  createMultiplayerGameScene,
  IMultiplayergameSceneConfig,
  MultiplayerRaceGameScene,
} from "../../game/MultiplayerRaceGameScene";
import { UserContext } from "../../providers/UserProvider";
import {
  m_ts_restart_game,
  m_ts_room_settings_changed,
} from "../../shared-backend/multiplayer-shared-stuff";
import { getSocket } from "../../utils/connectSocket";
import { defaultVehiclesSetup } from "../../vehicles/VehicleSetup";
import { clearBackdropCanvas } from "../backdrop/backdropCanvas";
import GameSettingsModal from "../gameRoom/GameSettingsModal";
import {
  getMultiplayerWaitingRoom,
  multiplayerConnectPagePath,
} from "../Routes";
import { IStore } from "../store";

interface IMultiplayerGameRoom {
  store: IStore;
}

interface WaitParamType {
  roomId: string;
}

let gameObject: MultiplayerRaceGameScene;
const MultiplayerGameRoom = (props: IMultiplayerGameRoom) => {
  const socket = getSocket();
  const params = useParams<WaitParamType>();
  const roomId = params?.roomId;
  const history = useHistory();
  const user = useContext(UserContext);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // you can only get here with a socket
  if (!socket) {
    if (gameObject) {
      gameObject.destroyGame();
    }
    if (roomId) {
      history.push(getMultiplayerWaitingRoom(roomId));
      return null;
    }
    history.push(multiplayerConnectPagePath);
    return null;
  }

  const handleEscPressed = () => {
    setSettingsModalOpen(true);
  };

  useEffect(() => {
    clearBackdropCanvas();

    const vehicleType = props.store.userSettings.vehicleSettings.vehicleType;
    const vehicleSetup =
      props.store.vehiclesSetup?.[vehicleType] ??
      defaultVehiclesSetup[vehicleType];
    const config: IMultiplayergameSceneConfig = {
      gameSettings: props.store.gameSettings,
      roomSettings: props.store.roomSettings,
      socket,
      player: props.store.player,
      userSettings: props.store.userSettings,
      vehicleSetup: vehicleSetup,
      players: props.store.players,
      gameRoomActions: {
        escPressed: handleEscPressed,
      },
    };
    createMultiplayerGameScene(MultiplayerRaceGameScene, config).then((g) => {
      gameObject = g;
    });

    return () => {
      socket.disconnect();
      gameObject?.destroyGame().then(() => {
        gameObject = null;
      });
    };
  }, []);

  const updateGameSettings = (newGameSettings: IGameSettings) => {
    gameObject.setGameSettings(newGameSettings);
  };

  const updateRoomSettings = (newRoomSettings: IRoomSettings) => {
    socket.emit(m_ts_room_settings_changed, { roomSettings: newRoomSettings });
    gameObject.setRoomSettings(newRoomSettings);
  };

  // gamesettings modal only for LEADEr?
  return (
    <React.Fragment>
      <IconButton
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          zIndex: 9999,
          fontSize: 32,
        }}
        onClick={() => {
          setSettingsModalOpen(!settingsModalOpen);
        }}
      >
        <SettingsIcon />
      </IconButton>
      <GameSettingsModal
        multiplayer
        gameObject={gameObject}
        open={settingsModalOpen}
        onClose={() => {
          setSettingsModalOpen(false);
          if (gameObject) {
            //   gameObject.unpauseGame();
          }
        }}
        store={props.store}
        userId={user?.uid}
        user={user}
        onlyLeaderCanSeeRoomSettings
        isTestMode={false}
        updateGameSettings={updateGameSettings}
        updateRoomSettings={updateRoomSettings}
        quitGame={(newPath: string) => {
          gameObject.destroyGame().then(() => {
            socket.disconnect();
            //     props.store.setSocket(undefined);
            //   setGameObject(undefined);
            gameObject = undefined;
            //   window.location.href = connectPagePath;
            history.push(newPath);
          });
        }}
        restarBtnPressed={() => {
          socket.emit(m_ts_restart_game, {});
          setSettingsModalOpen(false);
        }}
        showVehicleSettings
      />
    </React.Fragment>
  );
};

export default MultiplayerGameRoom;
