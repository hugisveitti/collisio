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
  disconnectSocket,
  getSocket,
  ISocketCallback,
} from "../../utils/connectSocket";
import { getDeviceType, inTestMode } from "../../utils/settings";
import BackdropContainer from "../backdrop/BackdropContainer";
import BackdropButton from "../button/BackdropButton";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import VolumeInput from "../inputs/VolumeInput";
import {
  getMultiplayerControlsRoomPath,
  getMultiplayerGameRoomPath,
  getMultiplayerWaitingRoom,
  loginPagePath,
  multiplayerConnectPagePath,
} from "../Routes";
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
  const [displayName, setDisplayName] = useState(getLocalDisplayName() ?? "");
  const [roomId, setRoomId] = useState(
    "" //(getLocalStorageItem("roomId", "string") as string) ?? ""
  );

  const [creatingRoom, setCreatingRoom] = useState(!roomId);

  const userId = user?.uid ?? getLocalUid();

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

      console.log("res", res);
      if (res.data.gameStarted) {
        if (res.data.roomSettings) {
          props.store.setRoomSettings(res.data.roomSettings);
        }
        props.store.setPlayers(res.data.players);
        for (let p of res.data.players) {
          if (p.id === userId) {
            props.store.setPlayer(p);
          }
        }
        if (onMobile) {
          history.push(getMultiplayerControlsRoomPath(res.data.roomId));
        } else {
          history.push(getMultiplayerGameRoomPath(res.data.roomId));
        }
      } else {
        history.push(getMultiplayerWaitingRoom(res.data.roomId));
      }
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
            <Grid item xs={12} sm={6}>
              <ToFrontPageButton
                beforeClick={() => {
                  disconnectSocket();
                }}
              />
            </Grid>
            {!user && (
              <Grid item xs={12} sm={6}>
                <BackdropButton style={{ float: "right" }} link={loginPagePath}>
                  Login
                </BackdropButton>
              </Grid>
            )}
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
                  if (!displayName || displayName === "") {
                    toast.error("Name cannot be empty");
                    return;
                  }
                  setIsConnecting(true);
                  handleConnectToRoom();
                }}
                color="white"
              >
                {creatingRoom ? "Create room" : "Connect to room"}
              </BackdropButton>
            </Grid>
          </>
        )}
        <Grid item xs={12} sm={6}>
          <VolumeInput store={props.store} />
        </Grid>
      </Grid>
    </BackdropContainer>
  );
};

export default MultiplayerConnectRoomContainer;
