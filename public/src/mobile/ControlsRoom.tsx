import { Modal } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast, ToastContainer } from "react-toastify";
import { Socket } from "socket.io-client";
import { frontPagePath } from "../components/Routes";
import { IStore } from "../components/store";
import DeviceOrientationPermissionComponent from "../components/waitingRoom/DeviceOrientationPermissionComponent";
import { getDBUserSettings } from "../firebase/firebaseFunctions";
import { UserContext } from "../providers/UserProvider";
import {
  MobileControls,
  setHasAskedDeviceOrientation,
} from "../utils/ControlsClasses";
import { isIphone } from "../utils/settings";
import ControllerSettingsComponent from "./ControllerSettingsComponent";
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
  const [breaks, setBreaks] = useState(false);
  const [reset, setReset] = useState(false);
  const [moreSpeed, setMoreSpeed] = useState(false);

  const [orientation, setOrientation] = useState({
    gamma: 0,
    beta: 0,
    alpha: 0,
  });

  // change these colors!
  const downColor = "#005c46"; // "green";
  const upColor = "#fcba03"; // "red";
  const [isPortrait, setIsPortrait] = useState(false);
  /** used to see if device orientation isnt working */
  const [deviceOrientationAsked, setDeviceOrientationAsked] = useState(false);

  const handleUserLoggedIn = () => {};

  const handleDeviceOrientChange = () => {
    if (screen.orientation?.type) {
      setIsPortrait(screen.orientation.type.slice(0, 8) === "portrait");
    } else {
      setIsPortrait(window.orientation === 0);
    }
  };

  const deviceOrientationHandler = (e: DeviceOrientationEvent) => {
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
    controller.beta = Math.round(beta);

    setOrientation({
      gamma,
      beta,
      alpha,
    });
  };

  if (!props.store?.roomId) {
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

  useEffect(() => {
    handleDeviceOrientChange();
    // for portait mode
    window.addEventListener("orientationchange", handleDeviceOrientChange);
    // for gamma, beta, alpha
    window.addEventListener("deviceorientation", deviceOrientationHandler);

    const sendControlsInterval = setInterval(() => {
      props.socket.emit("send-controls", controller);

      // set fps
    }, 1000 / 60);

    return () => {
      window.clearInterval(sendControlsInterval);
      window.removeEventListener("deviceorientation", deviceOrientationHandler);
      window.removeEventListener("orientationchange", handleDeviceOrientChange);
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      // hacky way
      // should have some emit from the game to the devices telling them to send info such as userSettings
      // 5000 ms then send it is hackkkky
      props.socket.emit("settings-changed", props.store.userSettings);
    }, 3000);
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

  const btnSize = screen.availWidth < 350 ? 120 : 150;
  const utilBtnSize = screen.availWidth < 350 ? 60 : 90;

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
        top: screen.availHeight / 2 - btnSize / 2,
      }
    : { left: screen.availWidth / 2 - btnSize / 2, top: 145 };
  const resetStyles = isPortrait
    ? { ...rotateText, left: 35, top: screen.availHeight / 2 - btnSize / 2 }
    : { left: screen.availWidth / 2 - btnSize / 2, top: 35 };

  const infoStyles = isPortrait
    ? {
        left: 0,
      }
    : {
        right: 0,
      };

  return (
    <React.Fragment>
      <Modal
        open={settingsModalOpen}
        onClose={() => {
          setSettingsModalOpen(false);
        }}
        style={{ border: 0 }}
      >
        <div
          style={{
            marginTop: 50,
            backgroundColor: "#eeebdf",
            border: "2px solid #000",
            padding: 10,
            outline: 0,
          }}
        >
          <ControllerSettingsComponent
            onClose={() => {
              handleButtonAction(false, "pause", setSettingsModalOpen);
            }}
            setSettingsModalOpen={setSettingsModalOpen}
            userLoggedIn={handleUserLoggedIn}
            socket={props.socket}
            resetOrientation={resetDeviceOrientationListener}
            user={user}
            store={props.store}
          />
        </div>
      </Modal>

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
