import CircularProgress from "@mui/material/CircularProgress";
import React, { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router";
import "react-toastify/dist/ReactToastify.css";
import { getLocalGameSetting } from "../../classes/localGameSettings";
import { addMusic, setMusicVolume, startMusic } from "../../sounds/gameSounds";
import { createClassNames } from "../../utils/utilFunctions";
import BackdropButton from "../button/BackdropButton";
import { gameRoomPath } from "../Routes";
import { IStore } from "../store";
import {
  changeCameraPosition,
  clearBackdropCanvas,
  createBackdropRenderer,
} from "./backdropCanvas";
import BlackLoadingPage from "./BlackLoadingPage";

interface IBackdropContainer {
  children: React.ReactNode;

  /** have the background color over the container */
  backgroundContainer?: boolean;

  store?: IStore;
  loading?: boolean;
  center?: boolean;
  noMusic?: boolean;
  autoEnter?: boolean;
}

let _pressedStartGame = false;
const BackdropContainer = (props: IBackdropContainer) => {
  const history = useHistory();

  const canvasWrapperRef = useRef();

  const [camPosNum, setCamPosNum] = useState(0);

  const [pressedStartGame, setPressedStartGame] = useState(
    _pressedStartGame || props.autoEnter
  );
  const [ratioLoaded, setRatioLoaded] = useState(0);

  const volume = props.noMusic
    ? 0
    : props.store?.gameSettings?.musicVolume ??
      getLocalGameSetting("musicVolume", "number");

  useEffect(() => {
    const { renderer, alreadyExisted } = createBackdropRenderer((compl) => {
      setRatioLoaded(compl);
    });

    if (alreadyExisted) {
      _pressedStartGame = true;
      setPressedStartGame(alreadyExisted);
      let num = 1;

      if (history.location.pathname !== "/") {
        num += 1;
      }
      changeCameraPosition(num, volume);
      setCamPosNum(num);
    } else if (props.store?.previousPage === gameRoomPath) {
      // if comming from game then someone pressed back to waiting room
      setPressedStartGame(true);
    }
    if (canvasWrapperRef?.current) {
      if (!alreadyExisted) {
        renderer.domElement.setAttribute("style", "max-width:100%;");
        renderer.domElement.setAttribute("style", "position:fixed;");
      }

      // @ts-ignore
      canvasWrapperRef.current.appendChild(renderer.domElement);
    }
  }, []);

  const handleChangeCameraPos = () => {
    // startMusic();
    changeCameraPosition(camPosNum + 1, volume);
    setCamPosNum(camPosNum + 1);
  };

  const renderEnterGameButton = () => {
    return (
      <div className="enter-game-button">
        <BlackLoadingPage ratio={ratioLoaded} />
        <BackdropButton
          style={{
            visibility: ratioLoaded < 1 ? "hidden" : "visible",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            textAlign: "center",
            transition: "2s",
          }}
          onClick={() => {
            handleChangeCameraPos();
            _pressedStartGame = true;
            setPressedStartGame(true);
          }}
          color="black"
        >
          Enter Game
        </BackdropButton>
      </div>
    );
  };

  return (
    <div
      style={{
        fontFamily: "monospace",
        textAlign: props.center ? "center" : "left",
      }}
    >
      {!pressedStartGame ? (
        renderEnterGameButton()
      ) : (
        <div
          id="backdrop-container"
          className={createClassNames(
            "container",
            props.backgroundContainer ? "background" : ""
          )}
          style={
            {
              // maxHeight: `${(screen?.availHeight ?? window.innerHeight) * 0.9}px`,
            }
          }
        >
          {props.loading ? (
            <div
              style={{
                marginTop: 25,
                textAlign: "center",
              }}
            >
              <CircularProgress />
            </div>
          ) : (
            props.children
          )}
        </div>
      )}
      <div ref={canvasWrapperRef}></div>
    </div>
  );
};

export default BackdropContainer;
