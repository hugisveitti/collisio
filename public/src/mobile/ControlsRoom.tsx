import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast, ToastContainer } from "react-toastify";
import { Socket } from "socket.io-client";
import { IEndOfRaceInfoGame, IEndOfRaceInfoPlayer } from "../classes/Game";
import { frontPagePath } from "../components/Routes";
import { IStore } from "../components/store";
import DeviceOrientationPermissionComponent from "../components/waitingRoom/DeviceOrientationPermissionComponent";
import {
  saveRaceDataGame,
  saveRaceDataPlayer,
} from "../firebase/firebaseFunctions";
import { UserContext } from "../providers/UserProvider";
import {
  MobileControls,
  mts_controls,
  mts_game_data_info,
  mts_user_settings_changed,
  stm_desktop_disconnected,
  stm_game_finished,
  stm_player_finished,
} from "../shared-backend/shared-stuff";
import { setHasAskedDeviceOrientation } from "../utils/ControlsClasses";
import { inTestMode, isIphone } from "../utils/settings";
import { invertedControllerKey } from "./ControllerSettingsComponent";
import ControllerSettingsModal from "./ControllerSettingsModal";
import "./ControlsRoom.css";

interface IControlsRoomProps {
  socket: Socket;
  store: IStore;
}

const controller = new MobileControls();

const ControlsRoom = (props: IControlsRoomProps) => {
  const history = useHistory();
  const user = useContext(UserContext);

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const [forward, setForward] = useState(false);
  const [backward, setBackward] = useState(false);
  const [reset, setReset] = useState(false);
  const [moreSpeed, setMoreSpeed] = useState(false);

  const [orientation, setOrientation] = useState({
    gamma: 0,
    beta: 0,
    alpha: 0,
  });

  // change these colors!
  const downColor = "#005c46";
  const upColor = "#fcba03";
  const [isPortrait, setIsPortrait] = useState(false);
  /** used to see if device orientation isnt working */
  const [deviceOrientationAsked, setDeviceOrientationAsked] = useState(false);
  const [sendControlsInterval, setSendControlsInterval] = useState(
    undefined as undefined | NodeJS.Timer
  );
  /** -1 if inverted */
  const [invertedController, setInvertedController] = useState(1);

  const handleUserLoggedIn = () => {};

  const handleDeviceOrientChange = () => {
    if (screen.orientation?.type) {
      setIsPortrait(screen.orientation.type.slice(0, 8) === "portrait");
    } else {
      setIsPortrait(window.orientation === 0);
    }
  };

  const deviceOrientationHandler = (e: DeviceOrientationEvent) => {
    // -1 if inverted

    const gamma = e.gamma ?? 0;
    const beta = e.beta ?? 0;
    const alpha = e.alpha ?? 0;
    if (e.gamma === null && e.beta === 0 && e.alpha === null) {
      if (!deviceOrientationAsked) {
        // this is hacky, just so the prompt doesnt go crazy
        setDeviceOrientationAsked(true);
        setHasAskedDeviceOrientation(false);
      }
    }

    controller.alpha = Math.round(alpha);
    controller.gamma = Math.round(gamma);
    controller.beta = Math.round(beta) * invertedController;

    setOrientation({
      gamma,
      beta,
      alpha,
    });
  };

  if (!props.store?.roomId && !inTestMode) {
    history.push(frontPagePath);
    toast.warn("No room connection, redirecting to frontpage");
    return null;
  }

  const resetDeviceOrientationListener = () => {
    toast("Resetting orientation");
    window.removeEventListener("deviceorientation", deviceOrientationHandler);
    setTimeout(() => {
      window.addEventListener("deviceorientation", deviceOrientationHandler);
    }, 100);
  };

  const createSendControlsInterval = () => {
    const _sendControlsInterval = setInterval(() => {
      props.socket.emit(mts_controls, controller);

      // set fps
    }, 1000 / 60);

    setSendControlsInterval(_sendControlsInterval);
  };

  useEffect(() => {
    handleDeviceOrientChange();
    // for portait mode
    window.addEventListener("orientationchange", handleDeviceOrientChange);
    // for gamma, beta, alpha
    window.addEventListener("deviceorientation", deviceOrientationHandler);

    // createSendControlsInterval();
    const _invertedController = window.localStorage.getItem(
      invertedControllerKey
    );
    if (_invertedController) {
      setInvertedController(+_invertedController);
    }

    props.socket.on(stm_desktop_disconnected, () => {
      toast.error("Game disconnected");
      history.push(frontPagePath);
      /** go to front page? */
    });

    return () => {
      props.socket.off(stm_desktop_disconnected);
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
      props.socket.emit(mts_user_settings_changed, props.store.userSettings);
    }, 1000);

    props.socket.on(stm_player_finished, (data: IEndOfRaceInfoPlayer) => {
      if (data.isAuthenticated) {
        saveRaceDataPlayer(data, (gameDataInfo) => {
          props.socket.emit(mts_game_data_info, gameDataInfo);
        });
      } else {
        toast.warning(
          "Your highscore won't be saved since you are not logged in."
        );
      }
    });

    props.socket.on(stm_game_finished, (data: IEndOfRaceInfoGame) => {
      if (user?.uid) {
        saveRaceDataGame(user.uid, data);
      } else {
        console.warn("Player not logged in, cannot save game");
      }
    });

    return () => {
      props.socket.off(stm_game_finished);
      props.socket.off(stm_player_finished);
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

  const screenHeight = screen.availHeight;
  const screenWidth = screen.availWidth;
  console.log("screen height", screenHeight);
  console.log("screen width", screenWidth);
  console.log("screen2 height", screen.height);
  console.log("screen2 width", screen.width);

  const btnSize = screenWidth < 350 ? 120 : 150;
  const utilBtnSize = screenWidth < 350 ? 60 : 90;

  const getSteeringDirection = () => {
    if (controller.beta < 0) {
      return "Right";
    }
    if (controller.beta > 0) {
      return "Left";
    }
    return "Straight";
  };

  const btnSizeStyle: React.CSSProperties = {
    width: btnSize,
    height: btnSize,
    lineHeight: btnSize + "px",
    fontSize: 32,
  };

  const utilbtnSizeStyle: React.CSSProperties = {
    width: utilBtnSize,
    height: utilBtnSize,
    lineHeight: utilBtnSize + "px",
    fontSize: 16,
  };

  const rotateText = { transform: "rotate(-90deg)" };
  const fButtonStyles = isPortrait
    ? { ...rotateText, top: 35 }
    : { bottom: 35 };
  const bButtonStyles = isPortrait
    ? { right: 35, ...rotateText }
    : { left: 35 };

  const settingsStyles = isPortrait
    ? {
        ...rotateText,
        left: btnSize + 45,
        top: screenHeight / 2 - btnSize / 2,
      }
    : { left: screenWidth / 2 - btnSize / 2, top: 145 };
  const resetStyles = isPortrait
    ? { ...rotateText, left: 35, top: screenHeight / 2 - btnSize / 2 }
    : { left: screenWidth / 2 - btnSize / 2, top: 35 };

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
          setSettingsModalOpen(false);
          handleButtonAction(false, "pause", setSettingsModalOpen);
        }}
        user={user}
        store={props.store}
        socket={props.socket}
      />

      <div
        className="controller-btn"
        onTouchStart={() => handleButtonAction(true, "f", setForward)}
        onTouchEnd={() => handleButtonAction(false, "f", setForward)}
        style={{
          ...btnSizeStyle,
          ...fButtonStyles,
          right: 35,
          color: forward ? upColor : downColor,
          backgroundColor: forward ? downColor : upColor,
        }}
      >
        F
      </div>
      <div
        className="controller-btn"
        onTouchStart={() => handleButtonAction(true, "b", setBackward)}
        onTouchEnd={() => handleButtonAction(false, "b", setBackward)}
        style={{
          ...btnSizeStyle,
          ...bButtonStyles,
          bottom: 35,
          color: backward ? upColor : downColor,
          backgroundColor: backward ? downColor : upColor,
        }}
      >
        B
      </div>

      <div
        className="controller-btn"
        onClick={() => handleButtonAction(true, "pause", setSettingsModalOpen)}
        style={{
          ...settingsStyles,
          ...utilbtnSizeStyle,
          color: downColor,
          backgroundColor: upColor,
        }}
      >
        Settings
      </div>
      <div
        className="controller-btn"
        onTouchStart={() => handleButtonAction(true, "resetVehicle", setReset)}
        onTouchEnd={() => handleButtonAction(false, "resetVehicle", setReset)}
        style={{
          ...resetStyles,
          ...utilbtnSizeStyle,
          color: reset ? upColor : downColor,
          backgroundColor: reset ? downColor : upColor,
        }}
      >
        Reset
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
        {getSteeringDirection()}
      </div>

      <div
        id="more-speed-info"
        style={{
          ...infoStyles,
          top: 0,
          transform: isPortrait ? "rotate(-90deg)" : "",
        }}
      >
        {moreSpeed && <span>MORE SPEED</span>}
      </div>
      <ToastContainer />
      <DeviceOrientationPermissionComponent
        onMobile={true}
        onIphone={isIphone()}
      />
    </React.Fragment>
  );
};

export default ControlsRoom;
function stm_game_finisehd(stm_game_finisehd: any, arg1: (data: any) => any) {
  throw new Error("Function not implemented.");
}
