import {
  CardContent,
  CardHeader,
  Collapse,
  Grid,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import { getTrackNameFromType } from "../../classes/Game";
import { getLocalUid } from "../../classes/localStorage";
import { IUser } from "../../classes/User";
import { green4 } from "../../providers/theme";
import {
  m_fs_room_settings_changed,
  m_fs_game_starting,
  m_fs_room_info,
  m_ts_room_settings_changed,
  m_ts_go_to_game_room_from_leader,
  m_ts_go_to_game_room_from_leader_callback,
  m_ts_in_waiting_room,
  m_ts_game_settings_changed,
  m_ts_left_waiting_room,
} from "../../shared-backend/multiplayer-shared-stuff";
import { mts_user_settings_changed } from "../../shared-backend/shared-stuff";
import { disconnectSocket, getSocket } from "../../utils/connectSocket";
import { getDeviceType } from "../../utils/settings";
import { defaultVehiclesSetup } from "../../vehicles/VehicleSetup";
import BackdropButton from "../button/BackdropButton";
import MyCard from "../card/MyCard";
import CollabsibleCard from "../inputs/CollapsibleCard";
import CopyTextButton from "../inputs/CopyTextButton";
import {
  getMultiplayerControlsRoomPath,
  getMultiplayerGameRoomPath,
  getMultiplayerWaitingRoom,
  multiplayerConnectPagePath,
} from "../Routes";
import GameSettingsComponent from "../settings/GameSettingsComponent";
import RoomSettingsComponent from "../settings/RoomSettingsComponent";
import VehicleSettingsComponent from "../settings/VehicleSettingsComponent";
import { IStore } from "../store";
import MultPlayerList from "./MultPlayerList";

// everyone who reaches here has a socket and a roomId

interface IMultiplayerWaitingRoomComponent {
  store: IStore;
  user: IUser | undefined;
}

const MultiplayerWaitingRoomComponent = (
  props: IMultiplayerWaitingRoomComponent
) => {
  const socket = getSocket();

  const [isLeader, setIsLeader] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const history = useHistory();
  const onMobile = getDeviceType() !== "desktop";
  const [moreInfo, setMoreInfo] = useState(false);

  const userId = props.user?.uid ?? getLocalUid();
  useEffect(() => {
    const vehicleType = props.store.userSettings.vehicleSettings.vehicleType;
    const vehicleSetup =
      props.store.vehiclesSetup?.[vehicleType] ??
      defaultVehiclesSetup[vehicleType];

    socket.emit(mts_user_settings_changed, {
      vehicleSetup,
      userSettings: props.store.userSettings,
    });
    socket.emit(m_ts_in_waiting_room, {});
    socket.on(m_fs_room_info, ({ players: _players, roomSettings }) => {
      if (Object.keys(roomSettings).length > 0) {
        props.store.setRoomSettings(roomSettings);
      }
      console.log("setting players", _players);
      props.store.setPlayers(_players);
      for (let i = 0; i < _players.length; i++) {
        if (_players[i].id === userId) {
          setIsLeader(_players[i].isLeader);
          props.store.setPlayer(_players[i]);
        }
      }
    });

    socket.on("disconnect", () => {
      history.push(multiplayerConnectPagePath);
    });

    socket.on(m_fs_game_starting, () => {
      // go to game room
      if (onMobile) {
        history.push(getMultiplayerControlsRoomPath(props.store.roomId));
      } else {
        history.push(getMultiplayerGameRoomPath(props.store.roomId));
      }
    });

    socket.on(m_fs_room_settings_changed, ({ roomSettings }) => {
      props.store.setRoomSettings(roomSettings);
    });

    return () => {
      socket.emit(m_ts_left_waiting_room, {});
      socket.off(m_fs_room_info);
      socket.off(m_ts_go_to_game_room_from_leader_callback);
    };
  }, []);

  const handleStartGame = () => {
    socket.emit(m_ts_go_to_game_room_from_leader, {});
    socket.once(m_ts_go_to_game_room_from_leader_callback, (res) => {
      if (res.status === "error") {
        toast.error(res.message);
        return;
      } else {
        // go to game room
        // m_fs_game_starting will probably reach first
      }
    });
  };

  return (
    <React.Fragment>
      <Grid item xs={12} sm={4}>
        <BackdropButton
          link={multiplayerConnectPagePath}
          onClick={() => {
            disconnectSocket();
          }}
        >
          Go back
        </BackdropButton>
      </Grid>
      <Grid item xs={12} sm={8}>
        <p style={{ fontSize: 24 }}>
          Multiplayer waiting room{" "}
          <span style={{ backgroundColor: green4 }}>{props.store.roomId}</span>{" "}
        </p>
      </Grid>
      <Grid item xs={12}>
        <CopyTextButton
          infoText="Copy Room link"
          copyText={
            window.location.origin +
            getMultiplayerWaitingRoom(props.store.roomId)
          }
        />
      </Grid>

      {isLeader && (
        <Grid item xs={12}>
          <BackdropButton
            loading={isLoading}
            onClick={() => {
              setIsLoading(true);
              handleStartGame();
            }}
            color="white"
          >
            Start Game
          </BackdropButton>
        </Grid>
      )}
      <Grid item xs={12}>
        <p>
          Use WASD or arrow keys to drive. If logged in then you can connect and
          steer with your phone.
        </p>
        <BackdropButton onClick={() => setMoreInfo(!moreInfo)}>
          {moreInfo ? "Less info" : "More info"}
        </BackdropButton>
      </Grid>
      <Grid item xs={12}>
        <Collapse in={moreInfo}>
          <p>
            To steer with your phone. Log in on the same account on your phone
            and desktop. Then on your mobile, go to the same room as your
            desktop and a small icon will appear next to your name in the
            players list. When the game starts your phone will turn into a
            controller!
          </p>
        </Collapse>
      </Grid>
      <Grid item xs={12}>
        <MultPlayerList players={props.store.players} userId={userId} />
      </Grid>
      {isLeader ? (
        <RoomSettingsComponent
          multiplayer
          roomSettings={props.store.roomSettings}
          onChange={(newRoomSettings) => {
            props.store.setRoomSettings(newRoomSettings);
            socket.emit(m_ts_room_settings_changed, {
              roomSettings: newRoomSettings,
            });
          }}
          store={props.store}
        />
      ) : (
        <React.Fragment>
          <Grid item xs={12} lg={4}>
            <Typography>
              Track: {getTrackNameFromType(props.store.roomSettings.trackName)}
            </Typography>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Typography>
              Number of laps: {props.store.roomSettings.numberOfLaps}
            </Typography>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Typography>Waiting for leader to start game</Typography>
          </Grid>
        </React.Fragment>
      )}

      <Grid item xs={12}>
        <CollabsibleCard header="Game Settings">
          <GameSettingsComponent
            multiplayer
            gameSettings={props.store.gameSettings}
            onChange={(newGameSettings) => {
              props.store.setGameSettings(newGameSettings);
              socket.emit(m_ts_game_settings_changed, {
                gameSettings: newGameSettings,
              });
            }}
            store={props.store}
          />
        </CollabsibleCard>
      </Grid>

      <Grid item xs={12}>
        <VehicleSettingsComponent
          maxWidth="100%"
          store={props.store}
          user={props.user}
        />
      </Grid>
    </React.Fragment>
  );
};

export default MultiplayerWaitingRoomComponent;
