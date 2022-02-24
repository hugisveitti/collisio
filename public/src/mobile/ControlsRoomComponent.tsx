/**
 * this component steers the MobileControls class
 */
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import SettingsIcon from "@mui/icons-material/Settings";
import RefreshIcon from "@mui/icons-material/Refresh";
import StarsIcon from "@mui/icons-material/Stars";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { MedalType } from "../shared-backend/medalFuncions";
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
  raceMedalData: undefined | { coins: number; XP: number; medal: MedalType };
}

const ControlsRoomComponent = (props: IControlsRoomComponent) => {
  const controller = props.controller;
  const orientation = props.orientation;
  const gameActions = props.gameActions;

  const [forward, setForward] = useState(false);
  const [backward, setBackward] = useState(false);
  const [reset, setReset] = useState(false);

  // change these colors!
  const downColor = "#ddd"; // blue4; // "#005c46";
  const upColor = "#111"; // orange2; // "#fcba03";
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

  // useEffect(() => {
  //   const fBtn = document.getElementById("fBtn");
  //   console.log("fBtn", fBtn);

  //   if (fBtn) {
  //     fBtn.addEventListener("touchforcechange", (e) => {
  //       e.preventDefault();
  //       return false;
  //     });
  //   }
  // }, []);

  // const screenHeight =
  //   document.fullscreenElement === null
  //     ? screen.availHeight
  //     : window.innerHeight;
  // const screenWidth =
  //   document.fullscreenElement === null ? screen.availWidth : window.innerWidth;

  const screenHeight = window.innerHeight;
  const screenWidth = window.innerWidth;

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
        // left: 35 + utilBtnSize * 2,
        right: 35,
      }
    : {
        //  top: 35 + utilBtnSize * 2
        bottom: 35,
      };

  const resetStyles = isPortrait
    ? {
        //  left: 35
        right: 55 + utilBtnSize,
      }
    : {
        //    top: 35
        bottom: 55 + utilBtnSize,
      };

  const infoStyles = isPortrait
    ? {
        left: 10,
        width: 100,
        height: 100,
      }
    : {
        top: 10,
        height: 100,
        width: 100,
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
          id="fBtn"
          className="controller-btn"
          onTouchStart={(e) => {
            e.preventDefault();
            handleButtonAction(true, "f", setForward);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleButtonAction(false, "f", setForward);
          }}
          draggable={false}
          style={{
            ...btnSizeStyle,
            ...fButtonStyles,
            right: 0,
            color: forward ? upColor : downColor,
            backgroundColor: getBackgroundColor(forward), // forward ? downColor : upColor,
            boxShadow: !forward ? "0px 25px #555" : "0px 5px #555",
            transition: ".1s",
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
          draggable={false}
          style={{
            ...btnSizeStyle,
            ...bButtonStyles,
            bottom: 0,
            color: backward ? upColor : downColor,
            backgroundColor: getBackgroundColor(backward), // backward ? downColor : upColor,
            boxShadow: !backward ? "0px -25px #555" : "0px -5px #555",
            transition: ".1s",
          }}
        >
          <span style={rotateText} className="controller-btn__text">
            B
          </span>
        </div>

        <div
          className="controller-btn util-btn"
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
          className="controller-btn util-btn"
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
            <SettingsIcon fontSize="large" />
          </span>
        </div>
        <div
          className="hide"
          id="medal-data"
          style={{
            ...settingsStyles,
            ...utilBtnPos,
            ...infoStyles,

            position: "absolute",
            zIndex: 99,

            backgroundColor: "white",
            color: "black",
            //    outline: "1px solid black",
            padding: 4,
          }}
        >
          <div style={rotateText}>
            {props.raceMedalData && (
              <>
                {props.raceMedalData.medal === "none" ? (
                  "You didn't win any medal"
                ) : (
                  <span>
                    <strong>{props.raceMedalData.medal.toUpperCase()}</strong>{" "}
                    medal winner!
                  </span>
                )}
                <br />
                <span>
                  <MonetizationOnIcon style={{ fontSize: 14 }} />{" "}
                  {props.raceMedalData.coins.toFixed(0)}
                </span>
                <br />
                <span>
                  <StarsIcon style={{ fontSize: 14 }} />{" "}
                  {props.raceMedalData.XP.toFixed(0)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default ControlsRoomComponent;
