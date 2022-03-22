import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import { IEndOfRaceInfoGame, IEndOfRaceInfoPlayer } from "../classes/Game";
import { frontPagePath } from "../components/Routes";
import { IStore } from "../components/store";
import DeviceOrientationPermissionComponent from "../components/waitingRoom/DeviceOrientationPermissionComponent";
import { getUserTokens } from "../firebase/firestoreFunctions";
import { saveRaceData } from "../firebase/firestoreGameFunctions";
import { UserContext } from "../providers/UserProvider";
import {
  defaultTokenData,
  getMedalAndTokens,
  ITokenData,
  MedalType,
} from "../shared-backend/medalFuncions";
import {
  GameActions,
  mdts_game_settings_changed,
  MobileControls,
  mts_controls,
  mts_game_data_info,
  MTS_SENDINTERVAL_MS,
  mts_send_game_actions,
  stm_desktop_disconnected,
  stm_game_finished,
  stm_game_settings_changed_callback,
  stm_player_finished,
  stm_player_info,
} from "../shared-backend/shared-stuff";
import { disconnectSocket, getSocket } from "../utils/connectSocket";
import { inTestMode, isIphone } from "../utils/settings";
import { invertedControllerKey } from "./ControllerSettingsComponent";
import ControllerSettingsModal from "./ControllerSettingsModal";
import "./ControlsRoom.css";
import ControlsRoomComponent, {
  hasOrientationPermission,
} from "./ControlsRoomComponent";

interface IControlsRoomProps {
  store: IStore;
}

let tokenData: ITokenData = defaultTokenData;
const controller = new MobileControls();
const gameActions = new GameActions();

/** -1 if inverted */
let invertedController = 1;

const ControlsRoom = (props: IControlsRoomProps) => {
  const history = useHistory();
  const user = useContext(UserContext);
  const socket = getSocket();

  const [orientation, setOrientation] = useState({
    gamma: 0,
    beta: 0,
    alpha: 0,
  });

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const [gameSettingsLoading, setGameSettingsLoading] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const [sendControlsInterval, setSendControlsInterval] = useState(
    undefined as undefined | NodeJS.Timer
  );
  const [resetOrientation, setResetOrientation] = useState(false);

  // const [deviceOrientationHandler, setDeviceOrientationHandler] = useState(undefined as () => void)

  const [raceMedalData, setRaceMedalData] = useState(
    undefined as undefined | { coins: number; XP: number; medal: MedalType }
  );

  const handleUserLoggedIn = () => {};

  if (!props.store?.roomId && !inTestMode) {
    history.push(frontPagePath);
    return null;
  }

  const createSendControlsInterval = () => {
    const _sendControlsInterval = setInterval(() => {
      socket.emit(mts_controls, controller);
      // setSteeringDirection(getSteeringDirection());
      const { gamma, beta, alpha } = controller;
      setOrientation({
        gamma,
        beta,
        alpha,
      });
      // set fps
    }, MTS_SENDINTERVAL_MS);

    setSendControlsInterval(_sendControlsInterval);
  };

  useEffect(() => {
    // createSendControlsInterval();
    const _invertedController = window.localStorage.getItem(
      invertedControllerKey
    );
    if (_invertedController) {
      invertedController = +_invertedController;
    }

    socket.on(stm_desktop_disconnected, () => {
      toast.error("Game disconnected");
      disconnectSocket();
      history.push(frontPagePath);
      /** go to front page? */
    });

    socket.on(stm_player_info, (res) => {
      const { player } = res;
      if (player) {
        props.store.setPlayer(player);
      }
    });

    return () => {
      window.clearInterval(sendControlsInterval);
      disconnectSocket();
      props.store.setPlayer(undefined);
      props.store.setPlayers([]);
      props.store.setRoomId(undefined);
    };
  }, []);

  useEffect(() => {
    // clearInterval(sendControlsInterval);
    if (!settingsModalOpen) {
      createSendControlsInterval();
    } else {
      clearInterval(sendControlsInterval);
    }
  }, [settingsModalOpen]);

  useEffect(() => {
    socket.on(stm_player_finished, (data: IEndOfRaceInfoPlayer) => {
      const md = getMedalAndTokens(
        data.trackName,
        data.numberOfLaps,
        data.totalTime
      );
      setRaceMedalData(md);
      if (user?.uid) {
        getUserTokens(user.uid)
          .then((data) => {
            props.store.setTokenData(data);
          })
          .catch(() => {
            props.store.setTokenData(defaultTokenData);
          });
      }

      const medalDiv = document.getElementById("medal-data");
      medalDiv.classList.remove("hide");
      // show for 10 secs?
      setTimeout(() => {
        medalDiv.classList.add("hide");
        setRaceMedalData(undefined);
      }, 10000);

      if (data.isAuthenticated) {
        saveRaceData(data.playerId, data).then(
          ([setPersonalBest, gameDataInfo]) => {
            socket.emit(mts_game_data_info, {
              playerId: data.playerId,
              gameDataInfo,
              setPersonalBest,
            });
          }
        );
      } else {
        toast.warning(
          "Your highscore won't be saved since you are not logged in."
        );
      }
    });

    // saving game data from game
    socket.on(stm_game_finished, (data: IEndOfRaceInfoGame) => {
      if (user?.uid) {
        // saveRaceDataGame(data);
      } else {
        console.warn("Player not logged in, cannot save game");
      }
    });

    setTimeout(() => {
      console.log("hasOrientationPermission()", hasOrientationPermission());
      if (!hasOrientationPermission()) {
        setShowPermissionModal(true);
      }
    }, 1000);

    return () => {
      /**
       * remove all socket listeners
       */
      socket.off(stm_game_settings_changed_callback);
      socket.off(stm_game_finished);
      socket.off(stm_player_finished);
    };
  }, []);

  useEffect(() => {
    if (props.store.tokenData) {
      tokenData = props.store.tokenData;
    }
  }, [props.store.tokenData]);

  const resetDeviceOrientationListener = () => {
    toast("Resetting orientation");
    setShowPermissionModal(true);
    setResetOrientation(!resetOrientation);
  };

  const sendGameActions = () => {
    socket.emit(mts_send_game_actions, gameActions);
    gameActions.pause = false;
    gameActions.restart = false;
  };

  const handleSendGameSettings = () => {
    if (!props.store.player.isLeader) {
      setSettingsModalOpen(false);
      setGameSettingsLoading(false);
      return;
    }

    socket.emit(mdts_game_settings_changed, {
      gameSettings: props.store.gameSettings,
      roomSettings: props.store.roomSettings,
    });
    setGameSettingsLoading(true);
    if (inTestMode) {
      setSettingsModalOpen(false);
      setGameSettingsLoading(false);
    }

    /** if the modal doesn't close, then just close it*/
    const timout = setTimeout(() => {
      setSettingsModalOpen(false);
      setGameSettingsLoading(false);
    }, 1000);

    socket.once(stm_game_settings_changed_callback, () => {
      clearTimeout(timout);
      setSettingsModalOpen(false);
      setGameSettingsLoading(false);
      gameActions.pause = false;
      sendGameActions();
    });
  };

  return (
    <React.Fragment>
      <ControllerSettingsModal
        userLoggedIn={handleUserLoggedIn}
        resetOrientation={resetDeviceOrientationListener}
        open={settingsModalOpen}
        onClose={() => {
          handleSendGameSettings();
        }}
        user={user}
        store={props.store}
        socket={socket}
        gameActions={gameActions}
        loading={gameSettingsLoading}
      />

      <ControlsRoomComponent
        handlePausePressed={() => {
          if (props.store.player.isLeader) {
            //   gameActions.pause = true;
            // sendGameActions();
          }
          setSettingsModalOpen(true);
        }}
        gameActions={gameActions}
        controller={controller}
        orientation={orientation}
        resetOrientation={resetOrientation}
        raceMedalData={raceMedalData}
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

export default ControlsRoom;
