import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Grid from "@mui/material/Grid";
import React, { useEffect } from "react";
import {
  IGameSettings,
  setAllLocalGameSettings,
} from "../../classes/localGameSettings";
import {
  mdts_game_settings_changed,
  stmd_game_settings_changed,
} from "../../shared-backend/shared-stuff";
import { IStore } from "../store";
import GameSettingsComponent from "./GameSettingsComponent";
import TagRulesComponent from "../waitingRoom/TagRulesComponent";
import { getDeviceType } from "../../utils/settings";
import { setMusicVolume } from "../../sounds/gameSounds";
import { getSocket } from "../../utils/connectSocket";

interface IGameSettingsContainer {
  store: IStore;
}

const GameSettingsContainer = (props: IGameSettingsContainer) => {
  const onMobile = getDeviceType() === "mobile";

  const socket = getSocket();

  useEffect(() => {
    socket.on(
      stmd_game_settings_changed,
      (data: { gameSettings: IGameSettings }) => {
        props.store.setGameSettings(data.gameSettings);
        setAllLocalGameSettings(data.gameSettings);

        if (!onMobile) {
          setMusicVolume(data.gameSettings.musicVolume);
        }
      }
    );
    return () => {
      socket.off(stmd_game_settings_changed);
    };
  }, []);

  return (
    <Grid item xs={12}>
      <Card
        variant="outlined"
        style={{
          backgroundColor: "inherit",
          width: "100%",
          color: "#fff",
        }}
      >
        <CardHeader
          title="Game Settings"
          subheader="The leader can also change game settings in game"
          subheaderTypographyProps={{
            color: "#eee",
          }}
        />
        <CardContent>
          <GameSettingsComponent
            gameSettings={props.store.gameSettings}
            onChange={(newGameSettings) => {
              props.store.setGameSettings(newGameSettings);
              socket.emit(mdts_game_settings_changed, {
                gameSettings: newGameSettings,
              });
            }}
            store={props.store}
          />
        </CardContent>
        <CardContent>
          {props.store.gameSettings.gameType === "tag" && <TagRulesComponent />}
        </CardContent>
        {/* <CardActions>
          <FindActiveTournamentComponent store={props.store} />
        </CardActions> */}
      </Card>
    </Grid>
  );
};

export default GameSettingsContainer;
