import VideogameAssetIcon from "@mui/icons-material/VideogameAsset";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import { Socket } from "socket.io-client";
import { v4 as uuid } from "uuid";
import { IPlayerConnection } from "../../classes/Game";
import { inputBackgroundColor } from "../../providers/theme";
import { UserContext } from "../../providers/UserProvider";
import {
  dts_create_room,
  mts_player_connected,
  std_room_created_callback,
  stm_player_connected_callback,
} from "../../shared-backend/shared-stuff";
import { ISocketCallback } from "../../utils/connectSocket";
import { getDeviceType } from "../../utils/settings";
import AvailableRoomsComponent from "../AvailableRoomsComponent";
import NotLoggedInModal from "../NotLoggedInModal";
import { waitingRoomPath } from "../Routes";
import { IStore } from "../store";

interface IConnectToWaitingRoomComponent {
  store: IStore;
  socket: Socket;
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

  const [notLoggedInModalOpen, setNotLoggedInModelOpen] = useState(false);
  const [connectingToRoom, setConnectingToRoom] = useState(
    props.quickConnection
  );

  const createRoomDesktop = () => {
    setConnectingToRoom(true);

    props.socket.emit(dts_create_room, {});
    props.socket.once(
      std_room_created_callback,
      (response: ISocketCallback) => {
        if (response.status === "success") {
          const { roomId } = response.data;
          props.store.setRoomId(roomId);
          goToWaitingRoom(roomId);
        } else {
          setConnectingToRoom(false);
          toast.error(response.message);
        }
      }
    );
  };

  // need the roomId for the mobile
  const connectButtonClicked = (roomId: string) => {
    if (!onMobile) {
      createRoomDesktop();
    } else {
      if (playerName.length === 0) {
        toast.error("Player name cannot be empty");
        return;
      }
      if (user) {
        connectToRoomMobile(roomId, playerName);
      } else {
        setNotLoggedInModelOpen(true);
      }
    }
  };

  useEffect(() => {
    if (user?.displayName) {
      setPlayerName(user.displayName);
    }
  }, [user]);

  const goToWaitingRoom = (roomId: string) => {
    history.push(waitingRoomPath + "/" + roomId);
  };

  const connectToRoomMobile = (roomId: string, playerName: string) => {
    setConnectingToRoom(true);

    props.socket.emit(mts_player_connected, {
      roomId: roomId.toLowerCase(),
      playerName,
      playerId: user?.uid ?? uuid(),
      isAuthenticated: Boolean(user),
      photoURL: user?.photoURL,
    } as IPlayerConnection);

    props.socket.once(
      stm_player_connected_callback,
      (response: ISocketCallback) => {
        console.log("player conn res", response);
        if (response.status === "error") {
          const { message } = response;
          toast.error(message);
          setConnectingToRoom(false);
        } else {
          toast.success(response.message);
          props.store.setPlayer(response.data.player);
          goToWaitingRoom(response.data.roomId);
        }
      }
    );
  };

  useEffect(() => {
    if (props.quickConnection && !onMobile) {
      createRoomDesktop();
    }
    return () => {
      props.socket.off(stm_player_connected_callback);
    };
  }, []);

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
      <NotLoggedInModal
        open={notLoggedInModalOpen}
        onClose={() => setNotLoggedInModelOpen(false)}
        infoText="You are not logged in. To use features such as saving highscore you
need to be logged in."
        onContinoueAsGuest={() => {
          connectToRoomMobile(props.store.roomId, playerName);
        }}
      />
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
