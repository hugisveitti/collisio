import { Modal } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast, ToastContainer } from "react-toastify";
import { Socket } from "socket.io-client";
import { frontPagePath } from "../components/Routes";
import { IStore } from "../components/store";
import { getDBUserSettings } from "../firebase/firebaseFunctions";
import { UserContext } from "../providers/UserProvider";
import { MobileControls } from "../utils/ControlsClasses";
import { isTestMode } from "../utils/settings";
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

  const downColor = "green";
  const upColor = "red";
  const [isPortrait, setIsPortrait] = useState(false);

  const handleUserLoggedIn = () => {
    console.log("handle user logged in");
  };

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

    controller.alpha = Math.round(alpha);
    controller.gamma = Math.round(gamma);
    controller.beta = Math.round(beta);
    controller.moreSpeed = gamma > 0 && gamma < 30;
    setMoreSpeed(controller.moreSpeed);

    setOrientation({
      gamma,
      beta,
      alpha,
    });
  };

  if (!props.store?.roomId && !isTestMode) {
    history.push(frontPagePath);
    toast.warn("No room connection, redirecting to frontpage");
    return null;
  }

  const resetDeviceOrientationListener = () => {
    toast("Resetting orientation");
    window.removeEventListener("deviceorientation", deviceOrientationHandler);
    window.addEventListener("deviceorientation", deviceOrientationHandler);
  };

  useEffect(() => {
    handleDeviceOrientChange();
    // for portait mode
    window.addEventListener("orientationchange", handleDeviceOrientChange);
    // for gamma, beta, alpha
    window.addEventListener("deviceorientation", deviceOrientationHandler);

    setInterval(() => {
      props.socket.emit("send-controls", controller);

      // set fps
    }, 1000 / 30);

    return () => {
      window.removeEventListener("deviceorientation", deviceOrientationHandler);
      window.removeEventListener("orientationchange", handleDeviceOrientChange);
    };
  }, []);

  useEffect(() => {
    if (user) {
      getDBUserSettings(user.uid, (settings) => {
        if (settings) {
          setTimeout(() => {
            // hacky way
            // should have some emit from the game to the devices telling them to send info such as userSettings
            // 5000 ms then send it is hackkkky
            props.socket.emit("settings-changed", settings);
          }, 5000);
        }
      });
    }
  }, [user]);

  // how to set key
  const handleButtonAction = (
    b: boolean,
    key: string,
    action: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    action(b);
    controller[key] = b;
  };

  const rotateText = { transform: "rotate(-90deg)" };
  const forwardStyles = isPortrait
    ? { ...rotateText, top: 35 }
    : { bottom: 35 };
  const backwardStyles = isPortrait
    ? { right: 35, ...rotateText }
    : { left: 35 };

  const breakStyles = isPortrait
    ? { ...rotateText, right: 145, bottom: 35 }
    : { left: 35, bottom: 145 };

  const settingsStyles = isPortrait
    ? { ...rotateText, left: 145, top: "50%" }
    : { left: "50%", top: 145 };
  const resetStyles = isPortrait
    ? { ...rotateText, left: 35, top: "50%" }
    : { left: "50%", top: 35 };

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
        onClose={() => setSettingsModalOpen(false)}
      >
        <div
          style={{
            // top: 50,
            // position: "absolute",
            marginTop: 50,
            backgroundColor: "#eeebdf",
            border: "2px solid #000",
            padding: 10,
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
          />
        </div>
      </Modal>

      <div
        className="controller-btn"
        onTouchStart={() => handleButtonAction(true, "forward", setForward)}
        onTouchEnd={() => handleButtonAction(false, "forward", setForward)}
        style={{
          ...forwardStyles,

          right: 35,
          color: forward ? upColor : downColor,
          backgroundColor: forward ? downColor : upColor,
        }}
      >
        Forward
      </div>
      <div
        className="controller-btn"
        onTouchStart={() => handleButtonAction(true, "backward", setBackward)}
        onTouchEnd={() => handleButtonAction(false, "backward", setBackward)}
        style={{
          bottom: 35,
          color: backward ? upColor : downColor,
          backgroundColor: backward ? downColor : upColor,
          ...backwardStyles,
        }}
      >
        Backward
      </div>
      <div
        className="controller-btn"
        onTouchStart={() => handleButtonAction(true, "break", setBreaks)}
        onTouchEnd={() => handleButtonAction(false, "break", setBreaks)}
        style={{
          ...breakStyles,
          color: breaks ? upColor : downColor,
          backgroundColor: breaks ? downColor : upColor,
        }}
      >
        Break
      </div>
      <div
        className="controller-btn"
        onClick={() => handleButtonAction(true, "pause", setSettingsModalOpen)}
        style={{
          ...settingsStyles,
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
          color: reset ? upColor : downColor,
          backgroundColor: reset ? downColor : upColor,
          ...resetStyles,
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
    </React.Fragment>
  );
};

export default ControlsRoom;
