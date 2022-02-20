import { CircularProgress } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router";
import { getLocalUid, saveLocalStorageItem } from "../../classes/localStorage";
import { UserContext } from "../../providers/UserProvider";
import {
  m_fs_connect_to_room_callback,
  m_ts_connect_to_room,
} from "../../shared-backend/multiplayer-shared-stuff";
import {
  createSocket,
  disconnectSocket,
  getSocket,
  ISocketCallback,
} from "../../utils/connectSocket";
import { multiplayerConnectPagePath } from "../Routes";
import { IStore } from "../store";
import MultiplayerControlsRoomComponent from "./MultiplayerControlsRoomComponent";
import { getUserConfig } from "./multiplayerUtilFunctions";

interface IMultiplayerControlsRoomContainer {
  store: IStore;
}

interface WaitParamType {
  roomId: string;
}

export const MultiplayerControlsRoomContainer = (
  props: IMultiplayerControlsRoomContainer
) => {
  const history = useHistory();

  const params = useParams<WaitParamType>();
  console.log("params", params);
  const roomId = params?.roomId;
  const user = useContext(UserContext);

  let socket = getSocket();
  const [isConnecting, setIsConnecting] = useState(!socket);

  if (!roomId && !socket) {
    console.log("No socket and no room", roomId);
    history.push(multiplayerConnectPagePath);
    return null;
  }

  const handleConnectToRoom = () => {
    props.store.setRoomId(roomId);
    // create a socket, try to connect to this room, or create it
    const config = getUserConfig(props.store, user);
    console.log("sending connect to room from mobile controls room", roomId);
    socket.emit(m_ts_connect_to_room, { roomId, config });
    socket.once(m_fs_connect_to_room_callback, (res: ISocketCallback) => {
      console.log("m_fs_connect_to_room_callback, res:", res);
      if (res.status === "error") {
        history.push(multiplayerConnectPagePath);
        return;
      }
      setIsConnecting(false);
      saveLocalStorageItem("roomId", res.data.roomId);
      props.store.setRoomId(res.data.roomId);
    });
  };

  useEffect(() => {
    if (user === null) return;

    if (!socket) {
      createSocket("mobile", user?.uid ?? getLocalUid(), "multiplayer").then(
        (s) => {
          // maybe user refreshes or leaves and comes back...
          socket = s;
          handleConnectToRoom();
        }
      );
    }
  }, [user]);

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  if (isConnecting)
    return (
      <div style={{ margin: "auto", marginTop: 100, textAlign: "center" }}>
        <CircularProgress />
      </div>
    );

  return <MultiplayerControlsRoomComponent store={props.store} />;
};

export default MultiplayerControlsRoomContainer;
