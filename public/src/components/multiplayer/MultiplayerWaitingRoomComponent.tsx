import { CardContent, CardHeader, Grid, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import { getTrackNameFromType } from "../../classes/Game";
import { getLocalUid } from "../../classes/localStorage";
import { IUser } from "../../classes/User";
import { green4 } from "../../providers/theme";
import {
  IMultPlayerInfo,
  m_fs_game_settings_changed,
  m_fs_game_starting,
  m_fs_room_info,
  m_fs_start_game_from_leader_callback,
  m_ts_game_settings_changed,
  m_ts_in_waiting_room,
  m_ts_start_game_from_leader,
} from "../../shared-backend/multiplayer-shared-stuff";
import { getSocket } from "../../utils/connectSocket";
import BackdropButton from "../button/BackdropButton";
import MyCard from "../card/MyCard";
import CopyTextButton from "../inputs/CopyTextButton";
import {
  getMultiplayerGameRoomPath,
  multiplayerConnectPagePath,
} from "../Routes";
import GameSettingsComponent from "../settings/GameSettingsComponent";
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
  const [players, setPlayers] = useState([] as IMultPlayerInfo[]);
  const [isLeader, setIsLeader] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const history = useHistory();

  const userId = props.user?.uid ?? getLocalUid();
  useEffect(() => {
    socket.emit(m_ts_in_waiting_room, {});
    socket.on(m_fs_room_info, ({ players: _players, gameSettings }) => {
      if (Object.keys(gameSettings).length > 0) {
        props.store.setGameSettings(gameSettings);
      }
      setPlayers(_players);
      for (let i = 0; i < _players.length; i++) {
        if (_players[i].id === userId) {
          setIsLeader(_players[i].isLeader);
        }
      }
    });

    socket.on("disconnect", () => {
      history.push(multiplayerConnectPagePath);
    });

    socket.on(m_fs_game_starting, () => {
      // go to game room

      history.push(getMultiplayerGameRoomPath(props.store.roomId));
    });

    socket.on(m_fs_game_settings_changed, ({ gameSettings }) => {
      props.store.setGameSettings(gameSettings);
    });

    return () => {
      socket.off(m_fs_room_info);
      socket.off(m_fs_start_game_from_leader_callback);
    };
  }, []);

  const handleStartGame = () => {
    socket.emit(m_ts_start_game_from_leader, {});
    socket.once(m_fs_start_game_from_leader_callback, (res) => {
      if (res.status === "error") {
        toast.error(res.message);
        return;
      } else {
        // go to game room
        // m_fs_game_starting will probably reach first
        console.log("Go to mul game room", res);
      }
    });
  };

  return (
    <>
      <Grid item xs={12}>
        <p style={{ fontSize: 24 }}>
          Multiplayer waiting room{" "}
          <span style={{ backgroundColor: green4 }}>{props.store.roomId}</span>{" "}
        </p>
      </Grid>
      <Grid item xs={12}>
        <CopyTextButton infoText="Copy Room link" copyText="Link copied!" />
      </Grid>

      {isLeader && (
        <Grid item xs={12}>
          <BackdropButton
            loading={isLoading}
            onClick={() => {
              setIsLoading(true);
              handleStartGame();
            }}
          >
            Start Game
          </BackdropButton>
        </Grid>
      )}
      <Grid item xs={12}>
        <MultPlayerList players={players} userId={userId} />
      </Grid>

      {isLeader ? (
        <>
          <Grid item xs={12}>
            <MyCard>
              <CardHeader
                title="Game Settings"
                subheader=""
                subheaderTypographyProps={{
                  color: "#eee",
                }}
              />
              <CardContent>
                <GameSettingsComponent
                  onlyRace
                  gameSettings={props.store.gameSettings}
                  onChange={(newGameSettings) => {
                    props.store.setGameSettings(newGameSettings);
                    socket.emit(m_ts_game_settings_changed, {
                      gameSettings: newGameSettings,
                    });
                  }}
                  store={props.store}
                />
              </CardContent>
            </MyCard>
          </Grid>
        </>
      ) : (
        <>
          <Grid item xs={6}>
            <Typography>
              Track: {getTrackNameFromType(props.store.gameSettings.trackName)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography>
              Number of laps: {props.store.gameSettings.numberOfLaps}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography>Waiting for leader to start game</Typography>
          </Grid>
        </>
      )}
      <Grid item xs={12}>
        <VehicleSettingsComponent store={props.store} user={props.user} />
      </Grid>
    </>
  );
};

export default MultiplayerWaitingRoomComponent;
