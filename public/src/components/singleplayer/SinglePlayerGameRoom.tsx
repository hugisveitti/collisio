import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { IGameSettings, IRoomSettings } from "../../classes/localGameSettings";
import { getLocalUid } from "../../classes/localStorage";
import { defaultUserSettings } from "../../classes/User";
import {
  createMultiplayerGameScene,
  MultiplayerRaceGameScene,
} from "../../game/MultiplayerRaceGameScene";
import { UserContext } from "../../providers/UserProvider";
import { m_ts_restart_game } from "../../shared-backend/multiplayer-shared-stuff";
import { IPlayerInfo } from "../../shared-backend/shared-stuff";
import { defaultVehiclesSetup } from "../../vehicles/VehicleSetup";
import { clearBackdropCanvas } from "../backdrop/backdropCanvas";
import GameSettingsModal from "../gameRoom/GameSettingsModal";
import { singlePlayerWaitingRoomPath } from "../Routes";
import { IStore } from "../store";
import {
  createSingleplayerGameScene,
  ISingleplayerGameSceneConfig,
  SingleplayerGameScene,
} from "./SinglePlayerGameScene";

interface ISingleplayerGameRoom {
  store: IStore;
}

let gameObject: SingleplayerGameScene;
const SingleplayerGameRoom = (props: ISingleplayerGameRoom) => {
  const user = useContext(UserContext);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const history = useHistory();

  const handleEscPressed = () => {
    setSettingsModalOpen(true);
  };

  useEffect(() => {
    clearBackdropCanvas();
    if (user === null) return;

    if (user && props.store.vehiclesSetup === undefined) {
      history.push(singlePlayerWaitingRoomPath);
      return;
    }
    const vehicleSettings =
      props.store.userSettings?.vehicleSettings ??
      defaultUserSettings.vehicleSettings;
    const vehicleType = vehicleSettings.vehicleType;
    const vehicleSetup =
      props.store.vehiclesSetup?.[vehicleType] ??
      defaultVehiclesSetup[vehicleType];

    const player: IPlayerInfo = props.store.player ?? {
      id: user?.uid ?? getLocalUid(),
      playerName: user?.displayName ?? "Guest",
      vehicleSetup,
      vehicleType,
      vehicleSettings,
      photoURL: "",
      isAuthenticated: !!user,
      playerNumber: 0,
      mobileConnected: false,
      isConnected: true,
      isLeader: true,
    };
    props.store.setPlayer(player);
    console.log("player", player, user, props.store);

    const config: ISingleplayerGameSceneConfig = {
      gameSettings: props.store.gameSettings,
      roomSettings: props.store.roomSettings,
      player,

      gameRoomActions: {
        escPressed: handleEscPressed,
      },
    };
    createSingleplayerGameScene(SingleplayerGameScene, config).then((g) => {
      gameObject = g;
    });

    return () => {
      gameObject?.destroyGame().then(() => {
        gameObject = null;
      });
    };
  }, [user]);

  const updateGameSettings = (newGameSettings: IGameSettings) => {
    console.log("update game settings", newGameSettings);

    gameObject.setGameSettings(newGameSettings);
  };

  const updateRoomSettings = (newRoomSettings: IRoomSettings) => {
    console.log("update room settings", newRoomSettings);

    gameObject.setRoomSettings(newRoomSettings);
  };

  return (
    <React.Fragment>
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
            gameObject = undefined;
            history.push(newPath);
          });
        }}
        restarBtnPressed={() => {
          gameObject?.restartGame();
          setSettingsModalOpen(false);
        }}
        showVehicleSettings
        onVehicleSettingsChange={(vehicleSettings) => {
          gameObject.vehicleSettingsChanged(vehicleSettings);
        }}
        onVehicleSetupChange={(vehicleSetup) => {
          gameObject.vehicleSetupChanged(vehicleSetup);
        }}
      />
    </React.Fragment>
  );
};

export default SingleplayerGameRoom;
