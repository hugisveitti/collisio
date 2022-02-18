import React from "react";
import { useHistory, useParams } from "react-router";
import { getSocket } from "../../utils/connectSocket";
import {
  getMultiplayerWaitingRoom,
  multiplayerConnectPagePath,
} from "../Routes";
import { IStore } from "../store";

interface IMultiplayerGameRoom {
  store: IStore;
}

interface WaitParamType {
  roomId: string;
}

const MultiplayerGameRoom = (props: IMultiplayerGameRoom) => {
  const socket = getSocket();
  const params = useParams<WaitParamType>();
  const roomId = params?.roomId;
  const history = useHistory();

  // you can only get here with a socket
  if (!socket) {
    if (roomId) {
      history.push(getMultiplayerWaitingRoom(roomId));
      return null;
    }
    history.push(multiplayerConnectPagePath);
    return null;
  }

  return (
    <React.Fragment>
      <h3>multiplayerGameRoomPagePath</h3>
    </React.Fragment>
  );
};

export default MultiplayerGameRoom;
