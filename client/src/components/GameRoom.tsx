import React from "react";
import { Socket } from "socket.io-client";
import { startGameOneMonitor } from "../one-monitor-game/one-monitor-game";
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
  startGameOneMonitor(
    props.socket,
    props.store.players,
    props.store.gameSettings
  );
  return null;
};

export default GameRoom;
