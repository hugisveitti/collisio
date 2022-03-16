import { Timestamp } from "@firebase/firestore";
import SettingsIcon from "@mui/icons-material/Settings";
import IconButton from "@mui/material/IconButton";
import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { IEndOfRaceInfoPlayer } from "../../classes/Game";
import {
  IGameSettings,
  IRoomSettings,
  setLocalRoomSetting,
} from "../../classes/localGameSettings";
import { getCookiesAllowed, getLocalUid } from "../../classes/localStorage";
import { defaultUserSettings } from "../../classes/User";
import { saveSinglePlayerData } from "../../firebase/firestoreFunctions";
import {
  saveRaceData,
  saveRaceDataGame,
} from "../../firebase/firestoreGameFunctions";
import {
  createEndlessRunnerScene,
  EndlessRunnerScene,
} from "../../game/EndlessRunnerScene";
import { IEndOfGameData } from "../../game/IGameScene";
import { UserContext } from "../../providers/UserProvider";
import { defaultOwnedTracks } from "../../shared-backend/ownershipFunctions";
import { IPlayerInfo } from "../../shared-backend/shared-stuff";
import { getCountryInfo } from "../../utils/connectSocket";
import { getRandomItem } from "../../utils/utilFunctions";
import { defaultVehiclesSetup } from "../../vehicles/VehicleSetup";
import { clearBackdropCanvas } from "../backdrop/backdropCanvas";
import EndOfGameModal, { IGameDataInfo } from "../gameRoom/EndOfGameModal";
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

let gameObject: SingleplayerGameScene | EndlessRunnerScene;
const SingleplayerGameRoom = (props: ISingleplayerGameRoom) => {
  const user = useContext(UserContext);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const history = useHistory();

  let endless = false;
  let split = location.pathname.split("/");
  if (split.length >= 4 && split[3] === "endless") {
    endless = true;
  }

  const [gameDataInfo, setGameDataInfo] = useState({
    bestTimesInfo: {},
  } as IGameDataInfo);
  const [endOfGameModalOpen, setEndOfGameModalOpen] = useState(false);
  const [endOfGameData, setEndOfGameData] = useState({} as IEndOfGameData);
  const handleEscPressed = () => {
    setSettingsModalOpen(true);
  };

  const handleGameFinished = (data: IEndOfGameData) => {
    setEndOfGameModalOpen(true);
    setEndOfGameData(data);
    saveRaceDataGame(data.endOfRaceInfo, () => {});
  };

  const handlePlayerFinished = (data: IEndOfRaceInfoPlayer) => {
    if (data.isAuthenticated) {
      saveRaceData(data.playerId, data).then(([setPB, pb]) => {
        const bestTimesInfo = {};
        bestTimesInfo[data.playerId] = pb;
        setGameDataInfo({ bestTimesInfo });
      });
    }
  };

  useEffect(() => {
    clearBackdropCanvas();
    if (user === null) return;

    if (user && props.store.vehiclesSetup === undefined && !endless) {
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
    props.store.setPlayers([player]);

    getCountryInfo().then((res) => {
      saveSinglePlayerData({
        country: res.country,
        inEurope: res.inEurope,
        player,
        roomSettings: props.store.roomSettings,
        gameSettings: props.store.gameSettings,
        date: Timestamp.now(),
        acceptedCookies: getCookiesAllowed(),
      });
    });

    const config: ISingleplayerGameSceneConfig = {
      gameSettings: props.store.gameSettings,
      roomSettings: props.store.roomSettings,
      player,

      gameRoomActions: {
        escPressed: handleEscPressed,
        gameFinished: handleGameFinished,
        playerFinished: handlePlayerFinished,
      },
    };
    if (!endless) {
      createSingleplayerGameScene(SingleplayerGameScene, config).then((g) => {
        gameObject = g;
      });
    } else {
      createEndlessRunnerScene(EndlessRunnerScene, config).then((g) => {
        gameObject = g;
      });
    }

    return () => {
      gameObject?.destroyGame().then(() => {
        gameObject = null;
      });
    };
  }, [user]);

  const updateGameSettings = (newGameSettings: IGameSettings) => {
    gameObject.setGameSettings(newGameSettings);
  };

  const updateRoomSettings = (newRoomSettings: IRoomSettings) => {
    gameObject.setRoomSettings(newRoomSettings);
  };

  const handleCloseModals = () => {
    setEndOfGameModalOpen(false);
    setEndOfGameData({});
    setSettingsModalOpen(false);
  };

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
      <EndOfGameModal
        store={props.store}
        open={endOfGameModalOpen}
        onClose={() => handleCloseModals()}
        data={endOfGameData}
        restartGame={() => {
          if (gameObject) {
            gameObject.restartGame();
          }
          handleCloseModals();
        }}
        scoreInfo={undefined}
        gameDataInfo={gameDataInfo}
        quitGame={(newPath: string) => {
          gameObject.destroyGame().then(() => {
            history.push(newPath);
          });
        }}
        randomTrack={() => {
          // start by just getting one of the default owend tracks
          // TODO extend to all owned tracks
          let newTrack = getRandomItem(
            defaultOwnedTracks,
            props.store.roomSettings.trackName
          );
          const newRoomSettings: IRoomSettings = {
            ...props.store.roomSettings,
            trackName: newTrack,
          };
          props.store.setRoomSettings(newRoomSettings);
          gameObject.setRoomSettings(newRoomSettings);
          gameObject.restartGame();
          setLocalRoomSetting("trackName", newTrack);
          handleCloseModals();
        }}
        singleplayer
      />
    </React.Fragment>
  );
};

export default SingleplayerGameRoom;
