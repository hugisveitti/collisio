import { Timestamp } from "@firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getGameSceneClass,
  IEndOfRaceInfoPlayer,
  IScoreInfo,
} from "../classes/Game";
import {
  IRoomSettings,
  setLocalRoomSetting,
} from "../classes/localGameSettings";
import { defaultVehicleSettings } from "../classes/User";
import EndOfGameModal, {
  IGameDataInfo,
} from "../components/gameRoom/EndOfGameModal";
import { frontPagePath } from "../components/Routes";
import { IStore } from "../components/store";
import DeviceOrientationPermissionComponent from "../components/waitingRoom/DeviceOrientationPermissionComponent";
import {
  getDBUserSettings,
  saveSinglePlayerData,
} from "../firebase/firestoreFunctions";
import {
  saveBestRaceData,
  saveRaceDataGame,
} from "../firebase/firestoreGameFunctions";
import { getVehiclesSetup } from "../firebase/firestoreOwnershipFunctions";
import { startGame } from "../game/GameScene";
import { IEndOfGameData, IGameScene } from "../game/IGameScene";
import ControllerSettingsModal from "../mobile/ControllerSettingsModal";
import ControlsRoomComponent from "../mobile/ControlsRoomComponent";
import { UserContext } from "../providers/UserProvider";
import {
  defaultOwnedRaceTracks,
  defaultOwnedTracks,
} from "../shared-backend/ownershipFunctions";
import {
  defaultVehicleColorType,
  GameActions,
  IPlayerInfo,
  MobileControls,
} from "../shared-backend/shared-stuff";
import {
  disconnectSocket,
  getCountryInfo,
  getSocket,
} from "../utils/connectSocket";
import { isIphone } from "../utils/settings";
import { getRandomItem, getSteerAngleFromBeta } from "../utils/utilFunctions";
import "./MobileExperiment.css";

interface IMobileGameExperiment {
  store: IStore;
}

const controller = new MobileControls();
const gameActions = new GameActions();

const MobileGameExperiment = (props: IMobileGameExperiment) => {
  const user = useContext(UserContext);
  const socket = getSocket();

  const [gameObject, setGameObject] = useState(undefined as IGameScene);
  // const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [endOfGameModalOpen, setEndOfGameModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [gameDataInfo, setGameDataInfo] = useState({} as IGameDataInfo);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const [gameSettingsLoading, setGameSettingsLoading] = useState(false);
  const [endOfGameData, setEndOfGameData] = useState({} as IEndOfGameData);

  const [scoreInfo, setScoreInfo] = useState({} as IScoreInfo);
  const [resetOrientation, setResetOrientation] = useState(false);

  const [orientation, setOrientation] = useState({
    alpha: 0,
    gamma: 0,
    beta: 0,
  });

  const [gameCanvas, setGameCanvas] = useState(undefined as HTMLCanvasElement);

  useEffect(() => {
    if (gameObject) {
      const canvases = document.getElementsByTagName("canvas");
      if (canvases.length > 0) {
        canvases[0].classList.add("game-canvas");
        setGameCanvas(canvases[0]);
      }
    }
  }, [gameObject]);

  useEffect(() => {
    if (gameCanvas) {
      setInterval(() => {
        gameCanvas.setAttribute(
          "style",
          `transform: rotateZ(${getSteerAngleFromBeta(
            controller.beta,
            props.store.userSettings.vehicleSettings.noSteerNumber ?? 4
          )}deg)`
        );
      }, 1000 / 90);
    }
  }, [gameCanvas]);

  const handleEscPressed = () => {
    // basically have to create a modal in the game class and show it there...
    //  setSettingsModalOpen(!settingsModalOpen);
  };

  const handelGameFinished = (data: IEndOfGameData) => {
    setEndOfGameModalOpen(true);
    saveRaceDataGame(data.endOfRaceInfo, (res) => {
      // do nothing
    });
    setEndOfGameData(data);
  };

  const handleUpdateScoreTable = (data: IScoreInfo) => {
    if (data) {
      setScoreInfo(data);
    }
  };

  const handlePlayerFinished = (data: IEndOfRaceInfoPlayer) => {
    if (data.isAuthenticated) {
      saveBestRaceData(data.playerId, data).then(
        ([setPersonalBest, gameInfo]) => {
          const newGameInfo: IGameDataInfo = {
            bestTimesInfo: {},
          };
          newGameInfo.bestTimesInfo[props.store.player.id] = gameInfo;
          setGameDataInfo(newGameInfo);
          setEndOfGameModalOpen(true);
        }
      );
    }
  };

  const resetDeviceOrientationListener = () => {
    toast("Resetting orientation");
    setShowPermissionModal(true);
    setResetOrientation(!resetOrientation);
  };

  const handleCloseModals = () => {
    setEndOfGameModalOpen(false);
    setEndOfGameData({});
    // setSettingsModalOpen(false);
  };

  useEffect(() => {
    if (socket) {
      disconnectSocket();
    }
  }, [socket]);

  useEffect(() => {
    if (user === null) return;
    if (user?.uid) {
      getDBUserSettings(user?.uid)
        .then((settings) => {
          props.store.setUserSettings(settings);
          getVehiclesSetup(user.uid).then((setups) => {
            props.store.setVehiclesSetup(setups);

            const newPlayer = {
              playerName: user.displayName,
              teamName: "",
              teamNumber: -1,
              playerNumber: 0,
              id: user.uid,
              isAuthenticated: true,
              vehicleType: settings.vehicleSettings.vehicleType,
              photoURL: user.photoURL,
            };
            const player: IPlayerInfo = {
              ...newPlayer,
              isLeader: true,
              isConnected: true,
              vehicleSetup: setups[settings.vehicleSettings.vehicleType],
              vehicleSettings: props.store.userSettings.vehicleSettings,
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
                onlyMobile: true,
                date: Timestamp.now(),
              });
            });
          });
        })
        .catch(() => {
          console.warn("user settings not found");
        });
    } else {
      let newPlayer = {
        playerName: "Guest",
        teamName: "",
        teamNumber: -1,
        playerNumber: 0,
        id: "guest-id",
        isAuthenticated: false,
        vehicleType: props.store.userSettings.vehicleSettings.vehicleType,
        photoURL: "",
      };
      const player: IPlayerInfo = {
        ...newPlayer,
        isLeader: true,
        isConnected: true,
        vehicleSetup: {
          vehicleColor: defaultVehicleColorType,
          vehicleType: props.store.userSettings.vehicleSettings.vehicleType,
        },
        vehicleSettings: defaultVehicleSettings,
      };

      props.store.setPlayer(player);
    }
  }, [user]);

  useEffect(() => {
    if (!props.store.player) return;
    const CurrGameScene = getGameSceneClass(props.store.roomSettings.gameType);

    startGame(
      CurrGameScene,
      {
        socket: socket,
        players: [props.store.player],
        gameSettings: props.store.gameSettings,
        roomSettings: props.store.roomSettings,
        roomId: props.store.roomId,
        gameRoomActions: {
          escPressed: handleEscPressed,
          gameFinished: handelGameFinished,
          updateScoreInfo: handleUpdateScoreTable,
          playerFinished: handlePlayerFinished,
          closeModals: handleCloseModals,
        },
        onlyMobile: true,
        mobileController: controller,
      },
      (_gameObject) => {
        setGameObject(_gameObject);
      }
    );
  }, [props.store.player]);

  const handleGameActions = () => {
    // const newPlayer = {
    //   ...props.store.player,
    //   vehi
    // }
    if (gameObject) {
      gameObject.setRoomSettings(props.store.roomSettings);
      gameObject.setGameSettings(props.store.gameSettings);
      gameObject.setVehicleSettings(
        0,
        props.store.userSettings.vehicleSettings,
        props.store.vehiclesSetup[
          props.store.userSettings.vehicleSettings.vehicleType
        ]
      );

      if (gameActions.pause) {
        setSettingsModalOpen(true);
        gameObject.pauseGame();
      } else {
        setSettingsModalOpen(false);
        gameObject.unpauseGame();
      }
      if (gameActions.restart) {
        gameObject.restartGame();
        setEndOfGameModalOpen(false);
        setSettingsModalOpen(false);
      }
    }
    gameActions.pause = false;
    gameActions.restart = false;
  };

  return (
    <React.Fragment>
      <ControllerSettingsModal
        userLoggedIn={() => {
          console.warn("User logged in to implemented");
        }}
        resetOrientation={resetDeviceOrientationListener}
        open={settingsModalOpen}
        onClose={() => {
          handleGameActions();
        }}
        user={user}
        store={props.store}
        socket={socket}
        gameActions={gameActions}
        loading={gameSettingsLoading}
      />

      <ControlsRoomComponent
        controller={controller}
        gameActions={gameActions}
        orientation={orientation}
        handlePausePressed={() => {
          gameObject.togglePauseGame();
          setSettingsModalOpen(true);
        }}
        transparantButtons
        resetOrientation={resetOrientation}
        raceMedalData={undefined}
      />

      <EndOfGameModal
        style={{ zIndex: 10000 }}
        store={props.store}
        open={endOfGameModalOpen}
        onClose={() => {
          setEndOfGameModalOpen(false);
        }}
        data={endOfGameData}
        restartGame={() => {
          if (gameObject) {
            gameObject.restartGame();
            setEndOfGameModalOpen(false);
          }
          setGameDataInfo({ bestTimesInfo: {} });
        }}
        scoreInfo={scoreInfo}
        gameDataInfo={gameDataInfo}
        quitGame={() => {
          window.location.href = frontPagePath;
        }}
        randomTrack={() => {
          let newTrack = getRandomItem(
            defaultOwnedRaceTracks,
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
      />

      <DeviceOrientationPermissionComponent
        onMobile={true}
        onIphone={isIphone()}
        showModal={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
      />
    </React.Fragment>
  );
};

export default MobileGameExperiment;
