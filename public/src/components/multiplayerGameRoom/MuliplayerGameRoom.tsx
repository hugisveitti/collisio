import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router";
import { IGameSettings } from "../../classes/localGameSettings";
import {
  createMultiplayerGameScene,
  IMultiplayergameSceneConfig,
  MultiplayerRaceGameScene,
} from "../../game/MultiplayerRaceGameScene";
import { UserContext } from "../../providers/UserProvider";
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

  useEffect(() => {
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
    };
    createMultiplayerGameScene(MultiplayerRaceGameScene, config).then((g) => {
      gameObject = g;
    });

    clearBackdropCanvas();
    return () => {
      socket.disconnect();
      gameObject?.destroyGame();
    };
  }, []);

  const updateGameSettings = (newGameSettings: IGameSettings) => {
    console.log("update game settings not implemented");
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
      />
    </React.Fragment>
  );
};

export default MultiplayerGameRoom;
