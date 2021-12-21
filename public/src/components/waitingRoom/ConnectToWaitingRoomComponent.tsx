import VideogameAssetIcon from "@mui/icons-material/VideogameAsset";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import { Socket } from "socket.io-client";
import { v4 as uuid } from "uuid";
import { IPlayerConnection } from "../../classes/Game";
import {
  getLocalStorageItem,
  saveLocalStorageItem,
} from "../../classes/localStorage";
import { inputBackgroundColor } from "../../providers/theme";
import { UserContext } from "../../providers/UserProvider";
import {
  dts_create_room,
  mts_player_connected,
  std_room_created_callback,
  stm_player_connected_callback,
} from "../../shared-backend/shared-stuff";
import { createSocket, ISocketCallback } from "../../utils/connectSocket";
import { getDeviceType } from "../../utils/settings";
import AvailableRoomsComponent from "../AvailableRoomsComponent";
import { waitingRoomPath } from "../Routes";
import { IStore } from "../store";

interface IConnectToWaitingRoomComponent {
  store: IStore;
  /**
   * if true then on desktop it will create a room right away
   * used if button in side nav clicked
   */
  quickConnection?: boolean;
}

const ConnectToWaitingRoomComponent = (
  props: IConnectToWaitingRoomComponent
) => {
  const user = useContext(UserContext);

  const history = useHistory();

  const [playerName, setPlayerName] = useState("");
  const onMobile = getDeviceType() === "mobile";

  const [connectingToRoom, setConnectingToRoom] = useState(
    props.quickConnection
  );

  const createRoomDesktop = (socket: Socket) => {
    setConnectingToRoom(true);

    socket.emit(dts_create_room, {
      data: {
        gameSettings: props.store.gameSettings,
        desktopUserId: user?.uid,
      },
    });
    socket.once(std_room_created_callback, (response: ISocketCallback) => {
      if (response.status === "success") {
        const { roomId } = response.data;
        props.store.setRoomId(roomId);
        goToWaitingRoom(roomId);
      } else {
        setConnectingToRoom(false);
        toast.error(response.message);
      }
    });
  };

  const handleConnection = (socket: Socket, roomId: string | undefined) => {
    if (!onMobile) {
      createRoomDesktop(socket);
    } else {
      if (playerName.length === 0) {
        toast.error("Player name cannot be empty");
        return;
      } else if (!roomId) {
        toast.error("Room id cannot be undefined");
        return;
      }
      connectToRoomMobile(roomId, playerName, socket);
    }
  };

  // need the roomId for the mobile
  const connectButtonClicked = (roomId?: string) => {
    if (!props.store.socket) {
      createSocket(getDeviceType(), (socket) => {
        props.store.setSocket(socket);
        handleConnection(socket, roomId);
      });
    } else {
      handleConnection(props.store.socket, roomId);
    }
  };

  const goToWaitingRoom = (roomId: string) => {
    history.push(waitingRoomPath + "/" + roomId);
  };

  const connectToRoomMobile = (
    roomId: string,
    playerName: string,
    socket: Socket
  ) => {
    setConnectingToRoom(true);

    socket.emit(mts_player_connected, {
      roomId: roomId.toLowerCase(),
      playerName,
      playerId: user?.uid ?? uuid(),
      isAuthenticated: Boolean(user),
      photoURL: user?.photoURL,
    } as IPlayerConnection);

    socket.once(stm_player_connected_callback, (response: ISocketCallback) => {
      if (response.status === "error") {
        const { message } = response;
        toast.error(message);
        setConnectingToRoom(false);
      } else {
        // toast.success(response.message);

        props.store.setGameSettings(response.data.gameSettings);
        props.store.setPlayer(response.data.player);
        goToWaitingRoom(response.data.roomId);
      }
    });
  };

  useEffect(() => {
    if (user?.displayName) {
      setPlayerName(user.displayName);
    }
  }, [user]);

  useEffect(() => {
    const roomId = getLocalStorageItem<string>("roomId");
    console.log("getting room id ", roomId);
    if (roomId) {
      props.store.setRoomId(roomId);
    }

    if (props.quickConnection && !onMobile) {
      connectButtonClicked();
    }
    return () => {};
  }, []);

  useEffect(() => {
    return () => {
      if (props.store.socket) {
        props.store.socket.off(stm_player_connected_callback);
        props.store.socket.off(std_room_created_callback);
      }
    };
  }, [props.store.socket]);

  if (connectingToRoom) {
    return (
      <React.Fragment>
        <Grid item xs={12}>
          <CircularProgress />
        </Grid>
        <Grid item xs={12}>
          <Typography>Connecting to room...</Typography>
        </Grid>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      {onMobile && (
        <>
          {user && (
            <Grid item xs={12} sm={12}>
              <AvailableRoomsComponent
                store={props.store}
                connectButtonClicked={connectButtonClicked}
                userId={user.uid}
              />
            </Grid>
          )}
          <Grid item xs={12} sm={6}>
            <TextField
              style={{
                backgroundColor: inputBackgroundColor,
              }}
              label="Player Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              disabled={!!user}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              style={{
                backgroundColor: inputBackgroundColor,
              }}
              fullWidth
              label="Room id"
              value={props.store.roomId}
              onChange={(e) => props.store.setRoomId(e.target.value)}
            />
          </Grid>
        </>
      )}

      <Grid item xs={12}>
        <Button
          onClick={() => connectButtonClicked(props.store.roomId)}
          variant="contained"
          size="large"
          startIcon={<VideogameAssetIcon />}
        >
          {!onMobile ? "Create a Game" : "Join a Game"}
        </Button>
      </Grid>
    </React.Fragment>
  );
};

export default ConnectToWaitingRoomComponent;
