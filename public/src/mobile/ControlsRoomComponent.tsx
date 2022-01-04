/**
 * this component steers the MobileControls class
 */
import PauseIcon from "@mui/icons-material/Pause";
import RefreshIcon from "@mui/icons-material/Refresh";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { blue4, orange2 } from "../providers/theme";
import { GameActions, MobileControls } from "../shared-backend/shared-stuff";
import "./ControlsRoom.css";

interface IControlsRoomComponent {
  controller: MobileControls;
  gameActions: GameActions;
  orientation: { alpha: number; beta: number; gamma: number };
  handlePausePressed: () => void;
  transparantButtons?: boolean;
  // hacky way to reset the event listeners
  resetOrientation: boolean;
  //setDeviceOrientationHandler:React.Dispatch<React.SetStateAction<void>>
}

const ControlsRoomComponent = (props: IControlsRoomComponent) => {
  const controller = props.controller;
  const orientation = props.orientation;
  const gameActions = props.gameActions;

  const [forward, setForward] = useState(false);
  const [backward, setBackward] = useState(false);
  const [reset, setReset] = useState(false);

  // change these colors!
  const downColor = blue4; // "#005c46";
  const upColor = orange2; // "#fcba03";
  const [isPortrait, setIsPortrait] = useState(false);

  const [steeringDirection, setSteeringDirection] = useState("");

  const handleDeviceOrientChange = () => {
    if (screen.orientation?.type) {
      setIsPortrait(screen.orientation.type.slice(0, 8) === "portrait");
    } else {
      setIsPortrait(window.orientation === 0);
    }
  };

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
    if (orientation.beta < 0) {
      return "Right";
    }
    if (orientation.beta > 0) {
      return "Left";
    }
    return "Straight";
  };

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

  useEffect(() => {
    handleDeviceOrientChange();
    // for portait mode
    window.addEventListener("orientationchange", handleDeviceOrientChange);
    // for gamma, beta, alpha
    window.addEventListener("deviceorientation", deviceOrientationHandler, {
      capture: true,
    });

    return () => {
      window.removeEventListener("deviceorientation", deviceOrientationHandler);
      window.removeEventListener("orientationchange", handleDeviceOrientChange);
    };
  }, []);

  useEffect(() => {
    window.removeEventListener("deviceorientation", deviceOrientationHandler, {
      capture: true,
    });
    setTimeout(() => {
      window.addEventListener("deviceorientation", deviceOrientationHandler, {
        capture: true,
      });
    }, 150);
  }, [props.resetOrientation]);

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

  const getBackgroundColor = (b: boolean) => {
    if (props.transparantButtons) return "none";
    if (b) return downColor;
    return upColor;
  };

  return (
    <React.Fragment>
      <div
        className="controller-container"
        style={{
          overflow: "hidden",
          zIndex: 1000,
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
            backgroundColor: getBackgroundColor(forward), // forward ? downColor : upColor,
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
            backgroundColor: getBackgroundColor(backward), // backward ? downColor : upColor,
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
            backgroundColor: getBackgroundColor(reset), // reset ? downColor : upColor,
          }}
        >
          <span style={rotateText}>
            <RefreshIcon fontSize="large" />
          </span>
        </div>

        <div
          className="controller-btn"
          onClick={() => {
            props.handlePausePressed();
          }}
          style={{
            ...settingsStyles,
            ...utilbtnSizeStyle,
            ...utilBtnPos,
            color: downColor,
            backgroundColor: getBackgroundColor(false),
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
          {getSteeringDirection()}
        </div>
      </div>
    </React.Fragment>
  );
};

export default ControlsRoomComponent;