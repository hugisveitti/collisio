import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast, ToastContainer } from "react-toastify";
import { Socket } from "socket.io-client";
import { startBallGameOneMonitor } from "../one-monitor-game/one-monitor-ball-game";
import {
  OneMonitorRaceGameScene,
  startRaceGameOneMonitor,
} from "../one-monitor-game/one-monitor-race-game";
import { startGameAuto } from "../utils/settings";
import GameSettingsModal from "./GameSettingsModal";
import { frontPagePath } from "./Routes";
import { IStore } from "./store";

interface IGameRoom {
  socket: Socket;
  store: IStore;
}

const GameRoom = (props: IGameRoom) => {
  // this breaks iphone
  // if (!props.store.roomId) {
  //   window.location.href = frontPagePath;
  // }
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [gameObject, setGameObject] = useState({} as OneMonitorRaceGameScene);

  const history = useHistory();

  const handleEscPressed = () => {
    // basically have to create a modal in the game class and show it there...
    setSettingsModalOpen(true);
  };

  useEffect(() => {
    props.socket.on("player-disconnected", ({ playerName }) => {
      toast.warn(
        `${playerName} disconnected from game, logged in players can reconnect!`
      );
    });

    if (!props.store.roomId && !startGameAuto) {
      history.push(frontPagePath);
      toast.warn("No room connection, redirecting to frontpage");
      return null;
    }
    if (props.store?.gameSettings?.typeOfGame === "ball") {
      startBallGameOneMonitor(
        props.socket,
        props.store.players,
        props.store.gameSettings
      );
    } else if (props.store?.gameSettings?.typeOfGame === "race") {
      startRaceGameOneMonitor(
        props.socket,
        props.store.players,
        props.store.gameSettings,
        props.store.roomId,
        handleEscPressed,
        (_gameObject) => {
          setGameObject(_gameObject);
        }
      );
    }
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
      />
      <ToastContainer />
    </React.Fragment>
  );
};

export default GameRoom;
