import React, { useEffect } from "react";
import { useHistory } from "react-router";
import { toast, ToastContainer } from "react-toastify";
import { Socket } from "socket.io-client";
import { initGryoscope } from "../mobile/mobileController";
import { isTestMode } from "../utils/settings";
import { frontPagePath } from "./Routes";
import { IStore } from "./store";

interface IControlsRoomProps {
  socket: Socket;
  store: IStore;
}

const ControlsRoom = (props: IControlsRoomProps) => {
  const history = useHistory();
  if (!props.store.roomName && !isTestMode) {
    history.push(frontPagePath);
    toast.warn("No room connection, redirecting to frontpage");
    return null;
  }

  useEffect(() => {
    initGryoscope(props.socket);
  }, []);

  return <ToastContainer />;
};

export default ControlsRoom;
