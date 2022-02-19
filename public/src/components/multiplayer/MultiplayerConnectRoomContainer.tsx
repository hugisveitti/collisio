import { CircularProgress, Collapse, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router";
import { toast } from "react-toastify";
import {
  getLocalDisplayName,
  getLocalStorageItem,
  getLocalUid,
  saveLocalStorageItem,
  setLocalDisplayName,
} from "../../classes/localStorage";

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
import { getDeviceType, inTestMode } from "../../utils/settings";
import BackdropContainer from "../backdrop/BackdropContainer";
import BackdropButton from "../button/BackdropButton";
import { getMultiplayerWaitingRoom } from "../Routes";
import { IStore } from "../store";
import MyTextField from "../textField/MyTextField";
import { getUserConfig } from "./multiplayerUtilFunctions";

interface IMultiplayerConnectRoomContainer {
  store: IStore;
}

const MultiplayerConnectRoomContainer = (
  props: IMultiplayerConnectRoomContainer
) => {
  const onMobile = getDeviceType() !== "desktop";
  const history = useHistory();
  const user = useContext(UserContext);
  let socket = getSocket();
  const [isConnecting, setIsConnecting] = useState(!!socket);
  const [displayName, setDisplayName] = useState(getLocalDisplayName());
  const [roomId, setRoomId] = useState(
    "" //(getLocalStorageItem("roomId", "string") as string) ?? ""
  );

  const [creatingRoom, setCreatingRoom] = useState(!roomId);

  const handleConnectToRoom = () => {
    props.store.setRoomId(roomId);
    setLocalDisplayName(displayName);
    // create a socket, try to connect to this room, or create it
    const config = getUserConfig(props.store, user);
    config.displayName = displayName;
    socket.emit(m_ts_connect_to_room, { roomId, config });
    socket.once(m_fs_connect_to_room_callback, (res: ISocketCallback) => {
      if (res.status === "error") {
        toast.error(res.message);
        setIsConnecting(false);
        return;
      }
      saveLocalStorageItem("roomId", res.data.roomId);
      props.store.setRoomId(res.data.roomId);
      history.push(getMultiplayerWaitingRoom(res.data.roomId));
    });
  };

  useEffect(() => {
    if (user !== null) {
      if (user) {
        setDisplayName(user.displayName);
      }
      // create socket
      createSocket(
        getDeviceType(),
        user?.uid ?? getLocalUid(),
        "multiplayer"
      ).then((_socket) => {
        socket = _socket;
        setIsConnecting(false);
        if (inTestMode) {
          handleConnectToRoom();
        }
      });
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
            <Grid item xs={12}>
              <Typography>Connect to multiplayer room</Typography>
            </Grid>
            <Grid item xs={12}>
              <MyTextField
                label="Name"
                onChange={(e) => setDisplayName(e.target.value)}
                value={displayName}
              />
            </Grid>

            <Grid item xs={12}>
              <MyTextField
                label="Room id, can be blank if creating room"
                onChange={(e) => {
                  setRoomId(e.target.value);
                  if (e.target.value.length > 0) {
                    setCreatingRoom(false);
                  } else {
                    setCreatingRoom(true);
                  }
                }}
                value={roomId}
              />
            </Grid>
            <Grid item xs={12}>
              <BackdropButton
                onClick={() => {
                  if (displayName === "") {
                    toast.error("Name cannot be empty");
                    return;
                  }
                  setIsConnecting(true);
                  handleConnectToRoom();
                }}
              >
                {creatingRoom ? "Create room" : "Connect to room"}
              </BackdropButton>
            </Grid>
          </>
        )}
      </Grid>
    </BackdropContainer>
  );
};

export default MultiplayerConnectRoomContainer;
