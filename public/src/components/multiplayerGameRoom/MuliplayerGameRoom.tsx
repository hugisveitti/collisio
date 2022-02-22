import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router";
import { IGameSettings } from "../../classes/localGameSettings";
import {
  createMultiplayerGameScene,
  IMultiplayergameSceneConfig,
  MultiplayerRaceGameScene,
} from "../../game/MultiplayerRaceGameScene";
import { UserContext } from "../../providers/UserProvider";
import {
  m_ts_game_settings_changed,
  m_ts_restart_game,
} from "../../shared-backend/multiplayer-shared-stuff";
import { stopMusic } from "../../sounds/gameSounds";
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
    console.log("Esc");
    setSettingsModalOpen(true);
  };

  useEffect(() => {
    stopMusic();
    clearBackdropCanvas();

    console.log("store", props.store);
    const vehicleType = props.store.userSettings.vehicleSettings.vehicleType;
    const vehicleSetup =
      props.store.vehiclesSetup?.[vehicleType] ??
      defaultVehiclesSetup[vehicleType];
    const config: IMultiplayergameSceneConfig = {
      gameSettings: props.store.gameSettings,
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
      console.log("game room umounted");
      socket.disconnect();
      gameObject?.destroyGame();
    };
  }, []);

  const updateGameSettings = (newGameSettings: IGameSettings) => {
    console.log("update game settings", newGameSettings);
    socket.emit(m_ts_game_settings_changed, { gameSettings: newGameSettings });
    gameObject.setGameSettings(newGameSettings);
  };

  // gamesettings modal only for LEADEr?
  return (
    <React.Fragment>
      <GameSettingsModal
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
        onlyLeaderCanSeeGameSettings
        isTestMode={false}
        updateGameSettings={updateGameSettings}
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
