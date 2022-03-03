import React, { useEffect } from "react";
import { useHistory, useParams } from "react-router";
import { clearBackdropCanvas } from "../components/backdrop/backdropCanvas";
import { getConnectPagePath } from "../components/Routes";
import { IStore } from "../components/store";
import { getSocket } from "../utils/connectSocket";
import ControlsRoom from "./ControlsRoom";

interface ControlsRoomParas {
  roomId: string;
}

interface IControlsRoomContainer {
  store: IStore;
}

const ControlsRoomContainer = (props: IControlsRoomContainer) => {
  const params = useParams<ControlsRoomParas>();
  const history = useHistory();
  const { roomId } = params;
  const socket = getSocket();

  const handleUnload = (e: BeforeUnloadEvent) => {
    // this string cannot be shown
    e.preventDefault();
    const msg = "Are you sure you want to close the controller?";
    e.returnValue = msg;
    return msg;
  };

  useEffect(() => {
    if (roomId && !socket) {
      history.push(getConnectPagePath(roomId));
    }
    console.log("in controls container");
    window.addEventListener("beforeunload", handleUnload);

    clearBackdropCanvas();
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  return <ControlsRoom store={props.store} />;
};

export default ControlsRoomContainer;
