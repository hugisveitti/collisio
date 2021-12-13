import PauseIcon from "@mui/icons-material/Pause";
import RefreshIcon from "@mui/icons-material/Refresh";
import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import { Socket } from "socket.io-client";
import { IEndOfRaceInfoGame, IEndOfRaceInfoPlayer } from "../classes/Game";
import { frontPagePath } from "../components/Routes";
import { IStore } from "../components/store";
import DeviceOrientationPermissionComponent from "../components/waitingRoom/DeviceOrientationPermissionComponent";
import { saveRaceData } from "../firebase/firestoreGameFunctions";
import { blue4, orange2 } from "../providers/theme";
import { UserContext } from "../providers/UserProvider";
import {
  GameActions,
  mdts_game_settings_changed,
  MobileControls,
  mts_controls,
  mts_game_data_info,
  MTS_SENDINTERVAL_MS,
  mts_send_game_actions,
  mts_user_settings_changed,
  stm_desktop_disconnected,
  stm_game_finished,
  stm_game_settings_changed_ballback,
  stm_player_finished,
} from "../shared-backend/shared-stuff";
import { inTestMode, isIphone } from "../utils/settings";
import { invertedControllerKey } from "./ControllerSettingsComponent";
import ControllerSettingsModal from "./ControllerSettingsModal";
import "./ControlsRoom.css";

interface IControlsRoomProps {
  store: IStore;
}

const controller = new MobileControls();
const gameActions = new GameActions();

const deviceOrientationHandler = (e: DeviceOrientationEvent) => {
  // -1 if inverted
  e.preventDefault();

  const gamma = e.gamma ?? 0;
  const beta = e.beta ?? 0;
  const alpha = e.alpha ?? 0;
  if (e.gamma === null && e.beta === 0 && e.alpha === null) {
    toast.error(
      "Your device orientation is not working. Please reset orientation in settings."
    );
  }

  controller.alpha = Math.round(alpha);
  controller.gamma = Math.round(gamma);
  controller.beta = Math.round(beta);
};

const getSteeringDirection = () => {
  if (controller.beta < 0) {
    return "Right";
  }
  if (controller.beta > 0) {
    return "Left";
  }
  return "Straight";
};

/** -1 if inverted */
let invertedController = 1;

const ControlsRoom = (props: IControlsRoomProps) => {
  const history = useHistory();
  const user = useContext(UserContext);

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const [forward, setForward] = useState(false);
  const [backward, setBackward] = useState(false);
  const [reset, setReset] = useState(false);
  const [gameSettingsLoading, setGameSettingsLoading] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const [orientation, setOrientation] = useState({
    gamma: 0,
    beta: 0,
    alpha: 0,
  });

  // change these colors!
  const downColor = blue4; // "#005c46";
  const upColor = orange2; // "#fcba03";
  const [isPortrait, setIsPortrait] = useState(false);

  const [steeringDirection, setSteeringDirection] = useState("");

  const [sendControlsInterval, setSendControlsInterval] = useState(
    undefined as undefined | NodeJS.Timer
  );

  const handleUserLoggedIn = () => {};

  const handleDeviceOrientChange = () => {
    if (screen.orientation?.type) {
      setIsPortrait(screen.orientation.type.slice(0, 8) === "portrait");
    } else {
      setIsPortrait(window.orientation === 0);
    }
  };

  if (!props.store?.roomId && !inTestMode) {
    history.push(frontPagePath);
    toast.warn("No room connection found.");
    return null;
  }

  const resetDeviceOrientationListener = () => {
    toast("Resetting orientation");
    setShowPermissionModal(true);
    window.removeEventListener("deviceorientation", deviceOrientationHandler, {
      capture: true,
    });
    setTimeout(() => {
      window.addEventListener("deviceorientation", deviceOrientationHandler, {
        capture: true,
      });
    }, 150);
  };

  const createSendControlsInterval = () => {
    const _sendControlsInterval = setInterval(() => {
      props.store.socket.emit(mts_controls, controller);
      setSteeringDirection(getSteeringDirection());
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
    handleDeviceOrientChange();
    // for portait mode
    window.addEventListener("orientationchange", handleDeviceOrientChange);
    // for gamma, beta, alpha
    window.addEventListener("deviceorientation", deviceOrientationHandler, {
      capture: true,
    });

    // createSendControlsInterval();
    const _invertedController = window.localStorage.getItem(
      invertedControllerKey
    );
    if (_invertedController) {
      invertedController = +_invertedController;
    }

    props.store.socket.on(stm_desktop_disconnected, () => {
      toast.error("Game disconnected");
      history.push(frontPagePath);
      /** go to front page? */
    });

    return () => {
      props.store.socket.off(stm_desktop_disconnected);
      window.clearInterval(sendControlsInterval);
      window.removeEventListener("deviceorientation", deviceOrientationHandler);
      window.removeEventListener("orientationchange", handleDeviceOrientChange);
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
    setTimeout(() => {
      // still need to send the stuff to the server
      // hacky way
      // should have some emit from the game to the devices telling them to send info such as userSettings
      // 5000 ms then send it is hackkkky
      props.store.socket.emit(
        mts_user_settings_changed,
        props.store.userSettings
      );
    }, 1000);

    props.store.socket.on(stm_player_finished, (data: IEndOfRaceInfoPlayer) => {
      if (data.isAuthenticated) {
        saveRaceData(data.playerId, data, (gameDataInfo) => {
          props.store.socket.emit(mts_game_data_info, gameDataInfo);
        });
      } else {
        toast.warning(
          "Your highscore won't be saved since you are not logged in."
        );
      }
    });

    // saving game data from game
    props.store.socket.on(stm_game_finished, (data: IEndOfRaceInfoGame) => {
      if (user?.uid) {
        // saveRaceDataGame(data);
      } else {
        console.warn("Player not logged in, cannot save game");
      }
    });

    return () => {
      /**
       * remove all socket listeners
       */
      props.store.socket.off(stm_game_settings_changed_ballback);
      props.store.socket.off(stm_game_finished);
      props.store.socket.off(stm_player_finished);
    };
  }, []);

  // how to set key
  const handleButtonAction = (
    b: boolean,
    key: keyof MobileControls,
    action: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    action(b);
    // dont know why this dont work
    // @ts-ignore
    controller[key] = b;
  };

  const screenHeight =
    document.fullscreenElement === null
      ? screen.availHeight
      : window.innerHeight;
  const screenWidth =
    document.fullscreenElement === null ? screen.availWidth : window.innerWidth;

  //const btnSize = screenWidth < 350 ? 120 : 150;

  const btnMargin = 10;
  const btnW = isPortrait ? screenWidth : screenWidth / 3 - btnMargin;
  const btnH = isPortrait ? screenHeight / 3 - btnMargin : screenHeight;

  const utilBtnSize = screenWidth < 350 ? 60 : 90;

  const sendGameActions = () => {
    props.store.socket.emit(mts_send_game_actions, gameActions);
    // handle
  };

  const handleSendGameSettings = () => {
    props.store.socket.emit(mdts_game_settings_changed, {
      gameSettings: props.store.gameSettings,
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

    props.store.socket.once(stm_game_settings_changed_ballback, () => {
      clearTimeout(timout);
      setSettingsModalOpen(false);
      setGameSettingsLoading(false);
      gameActions.pause = false;
      sendGameActions();
      setTimeout(() => {
        gameActions.pause = false;
        gameActions.restart = false;
      }, 150);
    });
  };

  const btnSizeStyle: React.CSSProperties = {
    width: btnW,
    height: btnH,
    lineHeight: btnH + "px",
    fontSize: 64,
  };

  const utilbtnSizeStyle: React.CSSProperties = {
    width: utilBtnSize,
    height: utilBtnSize,
    lineHeight: utilBtnSize + "px",
    fontSize: 16,
  };

  const rotateText: React.CSSProperties = isPortrait
    ? {
        transform: "rotate(-90deg)",
        position: "absolute",
      }
    : {};
  const fButtonStyles: React.CSSProperties = isPortrait
    ? { top: 0 }
    : { bottom: 0 };
  const bButtonStyles: React.CSSProperties = isPortrait
    ? { right: 0 }
    : { left: 0 };

  const utilBtnPos: React.CSSProperties = isPortrait
    ? {
        transform: `translate(0, -${utilBtnSize / 2}px)`,
        top: btnH * 1.5,
      }
    : {
        left: 1.5 * btnW,
        transform: `translate(-${utilBtnSize / 2}px, 0)`,
      };

  const settingsStyles = isPortrait
    ? {
        left: 35 + utilBtnSize * 2,
      }
    : { top: 35 + utilBtnSize * 2 };

  const resetStyles = isPortrait ? { left: 35 } : { top: 35 };

  const infoStyles = isPortrait
    ? {
        left: 0,
      }
    : {
        right: 0,
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
        socket={props.store.socket}
        gameActions={gameActions}
        loading={gameSettingsLoading}
      />
      <div
        className="controller-container"
        style={{
          overflow: "hidden",
        }}
      >
        <div
          className="controller-btn"
          onTouchStart={(e) => {
            e.preventDefault();
            handleButtonAction(true, "f", setForward);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleButtonAction(false, "f", setForward);
          }}
          style={{
            ...btnSizeStyle,
            ...fButtonStyles,
            right: 0,
            color: forward ? upColor : downColor,
            backgroundColor: forward ? downColor : upColor,
          }}
        >
          <span style={rotateText}>F</span>
        </div>
        <div
          className="controller-btn"
          onTouchStart={(e) => {
            e.preventDefault();
            handleButtonAction(true, "b", setBackward);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleButtonAction(false, "b", setBackward);
          }}
          style={{
            ...btnSizeStyle,
            ...bButtonStyles,
            bottom: 0,
            color: backward ? upColor : downColor,
            backgroundColor: backward ? downColor : upColor,
          }}
        >
          <span style={rotateText}>B</span>
        </div>

        <div
          className="controller-btn"
          onTouchStart={(e) => {
            e.preventDefault();
            handleButtonAction(true, "resetVehicle", setReset);
          }}
          onTouchEnd={() => handleButtonAction(false, "resetVehicle", setReset)}
          style={{
            ...utilBtnPos,
            ...resetStyles,
            ...utilbtnSizeStyle,
            color: reset ? upColor : downColor,
            backgroundColor: reset ? downColor : upColor,
          }}
        >
          <span style={rotateText}>
            <RefreshIcon fontSize="large" />
          </span>
        </div>

        <div
          className="controller-btn"
          onClick={() => {
            gameActions.pause = true;
            sendGameActions();
            setSettingsModalOpen(true);
          }}
          style={{
            ...settingsStyles,
            ...utilbtnSizeStyle,
            ...utilBtnPos,
            color: downColor,
            backgroundColor: upColor,
          }}
        >
          <span style={rotateText}>
            <PauseIcon fontSize="large" />
          </span>
        </div>

        <div
          id="orientation-info"
          style={{
            ...infoStyles,
            transform: isPortrait ? "rotate(-90deg)" : "",
            top: 0,
          }}
        >
          Beta:{orientation.beta.toFixed(0)}
          <br />
          Gamma:{orientation.gamma.toFixed(0)}
          <br />
          Alpha:{orientation.alpha.toFixed(0)}
          <br />
          {steeringDirection}
        </div>
      </div>

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
