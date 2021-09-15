import React from "react";
import { Socket } from "socket.io-client";
import { initGryoscope } from "../mobile/mobileController";
import { frontPagePath } from "./Routes";
import { IStore } from "./store";

interface IControlsRoomProps {
  socket: Socket;
  store: IStore;
}

const ControlsRoom = (props: IControlsRoomProps) => {
  if (!props.store.roomName) {
    window.location.href = frontPagePath;
  }
  initGryoscope(props.socket);
  return null;
};

export default ControlsRoom;
