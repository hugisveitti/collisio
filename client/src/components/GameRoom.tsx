import React from "react";
import { useHistory } from "react-router";
import { toast, ToastContainer } from "react-toastify";
import { Socket } from "socket.io-client";
import { startBallGameOneMonitor } from "../one-monitor-game/one-monitor-ball-game";
import { startRaceGameOneMonitor } from "../one-monitor-game/one-monitor-race-game";
import { frontPagePath } from "./Routes";
import { IStore } from "./store";

interface IGameRoom {
  socket: Socket;
  store: IStore;
}

const GameRoom = (props: IGameRoom) => {
  // this breaks iphone
  // if (!props.store.roomName) {
  //   window.location.href = frontPagePath;
  // }

  const history = useHistory();
  if (!props.store.roomName) {
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
      props.store.roomName
    );
  }

  return <ToastContainer />;
};

export default GameRoom;
