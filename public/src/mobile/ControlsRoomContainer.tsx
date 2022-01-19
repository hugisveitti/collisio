import React, { useEffect } from "react";
import { useHistory, useParams } from "react-router";
import { clearBackdropCanvas } from "../components/backdrop/backdropCanvas";
import { getWaitingRoomPath } from "../components/Routes";
import { IStore } from "../components/store";
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

  useEffect(() => {
    if (roomId && !props.store.socket) {
      history.push(getWaitingRoomPath(roomId));
    }

    clearBackdropCanvas();
  }, []);

  return <ControlsRoom store={props.store} />;
};

export default ControlsRoomContainer;
