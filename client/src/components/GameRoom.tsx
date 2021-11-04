import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast, ToastContainer } from "react-toastify";
import { Socket } from "socket.io-client";
import { startBallGameOneMonitor } from "../one-monitor-game/ball-game";
import { IGameScene } from "../one-monitor-game/IGameScene";
import {
  RaceGameScene,
  startRaceGame,
} from "../one-monitor-game/RaceGameScene";
import { UserContext } from "../providers/UserProvider";
import { startLowPolyTest } from "../test-courses/lowPolyTest";
import GameSettingsModal from "./GameSettingsModal";
import { frontPagePath } from "./Routes";
import { IStore } from "./store";

interface IGameRoom {
  socket: Socket;
  store: IStore;
  useTestCourse?: boolean;
  isTestMode?: boolean;
}

const GameRoom = (props: IGameRoom) => {
  // this breaks iphone
  // if (!props.store.roomId) {
  //   window.location.href = frontPagePath;
  // }
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [gameObject, setGameObject] = useState({} as IGameScene);

  const user = useContext(UserContext);
  const history = useHistory();

  const handleEscPressed = () => {
    // basically have to create a modal in the game class and show it there...
    setSettingsModalOpen(!settingsModalOpen);
  };

  useEffect(() => {
    props.socket.on("player-disconnected", ({ playerName }) => {
      toast.warn(
        `${playerName} disconnected from game, logged in players can reconnect!`
      );
    });

    if (props.useTestCourse) {
      return startLowPolyTest(
        props.socket,
        props.store.preGameSettings,
        handleEscPressed,
        (gameObject) => {
          setGameObject(gameObject);
        }
      );
    }

    if (!props.store.roomId) {
      history.push(frontPagePath);
      toast.warn("No room connection, redirecting to frontpage");
      return null;
    }
    if (props.store?.preGameSettings?.gameType === "ball") {
      startBallGameOneMonitor(
        props.socket,
        props.store.players,
        props.store.preGameSettings
      );
    } else if (props.store?.preGameSettings?.gameType === "race") {
      startRaceGame(
        props.socket,
        props.store.players,
        props.store.preGameSettings,
        props.store.userSettings.userGameSettings,
        props.store.roomId,
        handleEscPressed,
        (_gameObject) => {
          setGameObject(_gameObject);
        }
      );
    }

    return () => {
      props.socket.off("player-disconnected");
    };
  }, []);

  return (
    <React.Fragment>
      <GameSettingsModal
        gameObject={gameObject}
        open={settingsModalOpen}
        onClose={() => {
          setSettingsModalOpen(false);
          if (gameObject) {
            gameObject.togglePauseGame();
          }
        }}
        store={props.store}
        userId={user?.uid}
        isTestMode={props.isTestMode}
      />
      <ToastContainer />
    </React.Fragment>
  );
};

export default GameRoom;
