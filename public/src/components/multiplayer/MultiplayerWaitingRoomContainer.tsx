import { CircularProgress, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
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
  getSocket,
  ISocketCallback,
} from "../../utils/connectSocket";
import { getDeviceType } from "../../utils/settings";
import BackdropContainer from "../backdrop/BackdropContainer";
import { multiplayerConnectPagePath } from "../Routes";
import { IStore } from "../store";
import { getUserConfig } from "./multiplayerUtilFunctions";
import MultiplayerWaitingRoomComponent from "./MultiplayerWaitingRoomComponent";

interface IMultiplayerWaitingRoomContainer {
  store: IStore;
}

interface WaitParamType {
  roomId: string;
}

const MultiplayerWaitingRoomContainer = (
  props: IMultiplayerWaitingRoomContainer
) => {
  const user = useContext(UserContext);
  const history = useHistory();
  const params = useParams<WaitParamType>();
  const roomId = params?.roomId;
  let socket = getSocket();
  const [isConnecting, setIsConnecting] = useState(!socket);

  const handleConnectToRoom = () => {
    props.store.setRoomId(roomId);
    // create a socket, try to connect to this room, or create it
    const config = getUserConfig(props.store, user);
    console.log("sending connect to room", roomId);
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
    if (!roomId && !props.store.roomId) {
      console.log("no room id", roomId && props.store.roomId);
      history.push(multiplayerConnectPagePath);
      return;
    }

    if (user === null) return;
    console.log("user", user, "socket", socket);
    if (!socket) {
      console.log("no socket");
      createSocket(
        getDeviceType(),
        user?.uid ?? getLocalUid(),
        "multiplayer"
      ).then((_socket) => {
        console.log("socket created");
        socket = _socket;
        handleConnectToRoom();
      });
    } else if (!props.store.roomId) {
      handleConnectToRoom();
    }
  }, [user]);

  return (
    <BackdropContainer backgroundContainer>
      <Grid container spacing={3}>
        {isConnecting ? (
          <>
            <Grid item xs={12}>
              <CircularProgress />
            </Grid>
            <Grid item xs={12}>
              <Typography>Connecting...</Typography>
            </Grid>
          </>
        ) : (
          <>
            <MultiplayerWaitingRoomComponent store={props.store} user={user} />
          </>
        )}
      </Grid>
    </BackdropContainer>
  );
};

export default MultiplayerWaitingRoomContainer;
