import VideogameAssetIcon from "@mui/icons-material/VideogameAsset";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import { Socket } from "socket.io-client";
import {
  getLocalDisplayName,
  getLocalStorageItem,
  getLocalUid,
  setLocalDisplayName,
} from "../../classes/localStorage";
import { IUser } from "../../classes/User";
import { UserContext } from "../../providers/UserProvider";
import {
  dts_create_room,
  IPlayerConnectedData,
  mts_player_connected,
  std_room_created_callback,
  stm_player_connected_callback,
} from "../../shared-backend/shared-stuff";
import {
  createSocket,
  getCountryInfo,
  getSocket,
  ISocketCallback,
} from "../../utils/connectSocket";
import { getDeviceType } from "../../utils/settings";
import AvailableRoomsComponent from "../AvailableRoomsComponent";
import BackdropButton from "../button/BackdropButton";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import { getControlsRoomPath, loginPagePath, waitingRoomPath } from "../Routes";
import { IStore } from "../store";
import MyTextField from "../textField/MyTextField";
import NotCorrectCountryComponent from "./NotCorrectCountryComponent";

interface IConnectToWaitingRoomComponent {
  store: IStore;
  /**
   * if true then on desktop it will create a room right away
   * used if button in side nav clicked
   */
  quickConnection?: boolean;
  roomId?: string;
  user: IUser;
}

const ConnectToWaitingRoomComponent = (
  props: IConnectToWaitingRoomComponent
) => {
  const user = props.user;

  const [inEurope, setInEurope] = useState(true);
  const [country, setCountry] = useState("");
  const history = useHistory();
  const [playerName, setPlayerName] = useState(
    user?.displayName ?? getLocalDisplayName() ?? ""
  );
  const onMobile = getDeviceType() === "mobile";

  const [connectingToRoom, setConnectingToRoom] = useState(
    props.quickConnection
  );

  let socket = getSocket();
  const createRoomDesktop = (socket: Socket) => {
    setConnectingToRoom(true);

    socket.emit(dts_create_room, {
      data: {
        gameSettings: props.store.gameSettings,
        roomSettings: props.store.roomSettings,
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
        setConnectingToRoom(false);
        toast.error("Player name cannot be empty");
        return;
      } else if (!roomId) {
        setConnectingToRoom(false);

        toast.error("Room id cannot be undefined");
        return;
      }
      if (!user) {
        setLocalDisplayName(playerName);
      }
      connectToRoomMobile(roomId, playerName, socket);
    }
  };

  // need the roomId for the mobile
  const connectButtonClicked = (roomId?: string) => {
    if (!socket || !socket.connected) {
      createSocket(getDeviceType(), user?.uid ?? getLocalUid()).then(() => {
        socket = getSocket();
        handleConnection(socket, roomId);
      });
    } else {
      handleConnection(socket, roomId);
    }
  };

  const goToWaitingRoom = (roomId: string) => {
    history.push(waitingRoomPath + "/" + roomId);
  };

  const connectToRoomMobile = async (
    roomId: string,
    playerName: string,
    socket: Socket
  ) => {
    setConnectingToRoom(true);
    const vehicleType = props.store.userSettings.vehicleSettings.vehicleType;
    const vehicleSetup = props.store.vehiclesSetup?.[vehicleType] ?? {
      vehicleType,
    };
    socket.emit(mts_player_connected, {
      roomId: roomId.toLowerCase(),
      playerName,
      playerId: user?.uid ?? getLocalUid(),
      isAuthenticated: Boolean(user),
      photoURL: user?.photoURL,
      userSettings: props.store.userSettings,
      vehicleSetup,
    } as IPlayerConnectedData);

    socket.once(stm_player_connected_callback, (response: ISocketCallback) => {
      setConnectingToRoom(false);
      if (response.status === "error") {
        const { message } = response;
        // was spamming people
        // toast.error(message);
      } else {
        // toast.success(response.message);

        props.store.setGameSettings(response.data.gameSettings);
        props.store.setPlayer(response.data.player);
        if (response.data.gameStarted) {
          history.push(getControlsRoomPath(roomId));
        } else {
          goToWaitingRoom(response.data.roomId);
        }
      }
    });
  };

  useEffect(() => {
    if (user?.displayName) {
      setPlayerName(user.displayName);
    }
  }, [user]);

  useEffect(() => {
    const roomId = props.roomId ?? getLocalStorageItem<string>("roomId");
    if (roomId) {
      props.store.setRoomId(roomId);
    }

    getCountryInfo().then(({ inEurope: _inEurope, country: _country }) => {
      setInEurope(_inEurope);
      setCountry(_country);
      if (props.quickConnection && _inEurope) {
        connectButtonClicked(roomId);
      }
    });

    return () => {
      if (socket) {
        socket.off(stm_player_connected_callback);
        socket.off(std_room_created_callback);
      }
    };
  }, []);

  if (connectingToRoom) {
    return (
      <React.Fragment>
        <NotCorrectCountryComponent
          onClose={() => connectButtonClicked(props.store.roomId)}
          inEurope={inEurope}
          country={country}
        />
        <Grid item xs={12} style={{ textAlign: "center" }}>
          <CircularProgress />
        </Grid>
        <Grid item xs={12} style={{ textAlign: "center" }}>
          <Typography>Connecting to room...</Typography>
        </Grid>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <Grid item xs={12}>
        <ToFrontPageButton />
      </Grid>
      {onMobile && (
        <>
          {user && (
            <Grid item xs={12} sm={12}>
              <AvailableRoomsComponent
                store={props.store}
                connectButtonClicked={(roomId: string) => {
                  setConnectingToRoom(true);
                  connectButtonClicked(roomId);
                }}
                userId={user.uid}
              />
            </Grid>
          )}
          <Grid item xs={12} sm={6}>
            <MyTextField
              label="Player Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              disabled={!!user}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <MyTextField
              fullWidth
              label="Room id"
              value={props.store.roomId}
              onChange={(e) => props.store.setRoomId(e.target.value)}
            />
          </Grid>
        </>
      )}

      <Grid item xs={12}>
        <BackdropButton
          onClick={() => {
            setConnectingToRoom(true);
            connectButtonClicked(props.store.roomId);
          }}
          startIcon={<VideogameAssetIcon />}
        >
          {!onMobile ? "Create a Game" : "Join Game"}
        </BackdropButton>
      </Grid>
      {!user && (
        <Grid item xs={12}>
          <BackdropButton link={loginPagePath}>Login</BackdropButton>
        </Grid>
      )}
    </React.Fragment>
  );
};

export default ConnectToWaitingRoomComponent;
