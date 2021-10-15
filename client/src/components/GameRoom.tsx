import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast, ToastContainer } from "react-toastify";
import { Socket } from "socket.io-client";
import { startBallGameOneMonitor } from "../one-monitor-game/one-monitor-ball-game";
import { startRaceGameOneMonitor } from "../one-monitor-game/one-monitor-race-game";
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

  const history = useHistory();

  const handleEscPressed = () => {
    // basically have to create a modal in the game class and show it there...
    // setSettingsModalOpen(true);
  };

  useEffect(() => {
    props.socket.on("player-disconnected", ({ playerName }) => {
      toast.warn(`${playerName} disconnected from game`);
    });

    if (!props.store.roomId) {
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
        handleEscPressed
        // (_unpauseFunc) => setUnpauseGameFunc(_unpauseFunc)
      );
    }
  }, []);

  return (
    <React.Fragment>
      <GameSettingsModal
        open={settingsModalOpen}
        onClose={() => {
          setSettingsModalOpen(false);
        }}
      />
      <ToastContainer />
    </React.Fragment>
  );
};

export default GameRoom;
