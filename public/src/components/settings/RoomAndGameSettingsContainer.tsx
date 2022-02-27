import Grid from "@mui/material/Grid";
import React, { useEffect } from "react";
import {
  IGameSettings,
  IRoomSettings,
  setAllLocalGameSettings,
  setAllLocalRoomSettings,
} from "../../classes/localGameSettings";
import {
  mdts_game_settings_changed,
  stmd_game_settings_changed,
} from "../../shared-backend/shared-stuff";
import { setMusicVolume } from "../../sounds/gameSounds";
import { getSocket } from "../../utils/connectSocket";
import { getDeviceType } from "../../utils/settings";
import CollabsibleCard from "../inputs/CollapsibleCard";
import { IStore } from "../store";
import TagRulesComponent from "../waitingRoom/TagRulesComponent";
import GameSettingsComponent from "./GameSettingsComponent";
import RoomSettingsComponent from "./RoomSettingsComponent";

interface IRoomAndGameSettingsContainer {
  store: IStore;
}

const RoomAndGameSettingsContainer = (props: IRoomAndGameSettingsContainer) => {
  const onMobile = getDeviceType() === "mobile";

  const socket = getSocket();

  useEffect(() => {
    socket?.on(
      stmd_game_settings_changed,
      (data: { gameSettings: IGameSettings; roomSettings: IRoomSettings }) => {
        console.log("settings change", data);
        if (data.gameSettings) {
          props.store.setGameSettings(data.gameSettings);
          setAllLocalGameSettings(data.gameSettings);

          if (!onMobile) {
            setMusicVolume(data.gameSettings.musicVolume);
          }
        }
        if (data.roomSettings) {
          props.store.setRoomSettings(data.roomSettings);
          setAllLocalRoomSettings(data.roomSettings);
        }
      }
    );
    return () => {
      socket?.off(stmd_game_settings_changed);
    };
  }, []);

  return (
    <React.Fragment>
      <RoomSettingsComponent
        roomSettings={props.store.roomSettings}
        onChange={(newRoomSettings) => {
          props.store.setRoomSettings(newRoomSettings);
          socket?.emit(mdts_game_settings_changed, {
            roomSettings: newRoomSettings,
          });
        }}
        store={props.store}
      />
      <Grid item xs={12}>
        <CollabsibleCard header="Game Settings">
          <GameSettingsComponent
            gameSettings={props.store.gameSettings}
            onChange={(newGameSettings) => {
              props.store.setGameSettings(newGameSettings);
              socket?.emit(mdts_game_settings_changed, {
                gameSettings: newGameSettings,
              });
            }}
            store={props.store}
          />
        </CollabsibleCard>
      </Grid>

      <Grid item xs={12}>
        {props.store.roomSettings.gameType === "tag" && <TagRulesComponent />}
      </Grid>
    </React.Fragment>
  );
};

export default RoomAndGameSettingsContainer;
