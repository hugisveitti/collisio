import React from "react";
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
  if (!props.store.roomName) {
    window.location.href = frontPagePath;
  }
  if (props.store.gameSettings.typeOfGame === "ball") {
    startBallGameOneMonitor(
      props.socket,
      props.store.players,
      props.store.gameSettings
    );
  } else {
    startRaceGameOneMonitor(
      props.socket,
      props.store.players,
      props.store.gameSettings
    );
  }

  return null;
};

export default GameRoom;
