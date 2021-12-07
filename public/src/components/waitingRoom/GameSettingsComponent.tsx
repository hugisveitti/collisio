import FormControl from "@mui/material/FormControl";
import Radio from "@mui/material/Radio";
import FormLabel from "@mui/material/FormLabel";
import FormControlLabel from "@mui/material/FormControlLabel";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Grid from "@mui/material/Grid";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";
import React, { useEffect } from "react";
import { useHistory } from "react-router";
import { Socket } from "socket.io-client";
import { defaultRaceTrack, defaultTagTrack } from "../../classes/Game";
import {
  IGameSettings,
  setLocalGameSetting,
} from "../../classes/localGameSettings";
import { inputBackgroundColor } from "../../providers/theme";
import {
  mdts_game_settings_changed,
  stmd_game_settings_changed,
} from "../../shared-backend/shared-stuff";
import TrackSelect from "../inputs/TrackSelect";
import { IStore } from "../store";
import TagRulesComponent from "./TagRulesComponent";

interface IGameSettingsComponent {
  store: IStore;
  userId: string | undefined;
}

const GameSettingsComponent = (props: IGameSettingsComponent) => {
  const history = useHistory();

  useEffect(() => {
    props.store.socket.on(stmd_game_settings_changed, (data) => {
      props.store.setGameSettings(data.gameSettings);
    });
    return () => {
      props.store.socket.off(stmd_game_settings_changed);
    };
  }, []);

  const updateGameSettings = (key: keyof IGameSettings, value: any) => {
    const newGameSettings = { ...props.store.gameSettings };
    // @ts-ignore
    newGameSettings[key] = value;

    if (key === "gameType") {
      if (value === "tag") {
        newGameSettings.trackName = defaultTagTrack;
      } else if (value === "race") {
        newGameSettings.trackName = defaultRaceTrack;
      }
    }

    setLocalGameSetting(key, value);

    props.store.setGameSettings(newGameSettings);

    props.store.socket.emit(mdts_game_settings_changed, {
      gameSettings: newGameSettings,
    });
  };

  return (
    <Grid item xs={12}>
      <Card
        variant="outlined"
        style={{
          backgroundColor: "inherit",
          width: "100%",
        }}
      >
        <CardHeader title="Game Settings" subheader="You can change settings" />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={3}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Type of game</FormLabel>
                <RadioGroup
                  row
                  aria-label="type of game"
                  name="row-radio-buttons-group"
                >
                  <FormControlLabel
                    value="race"
                    control={
                      <Radio
                        onChange={() => updateGameSettings("gameType", "race")}
                        checked={props.store.gameSettings.gameType === "race"}
                      />
                    }
                    label="Race"
                  />
                  <FormControlLabel
                    value="tag"
                    control={
                      <Radio
                        onChange={() => {
                          updateGameSettings("gameType", "tag");
                          //  toast("Tag game not available yet");
                        }}
                        checked={props.store.gameSettings.gameType === "tag"}
                      />
                    }
                    label="Tag"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            {props.store.gameSettings.gameType === "tag" ? (
              <React.Fragment>
                <Grid item xs={12} sm={4} lg={4} xl={2}>
                  <TextField
                    type="number"
                    label="Tag game length in minutes"
                    value={props.store.gameSettings.tagGameLength}
                    style={{ backgroundColor: inputBackgroundColor }}
                    onChange={(ev) => {
                      updateGameSettings("tagGameLength", +ev.target.value);
                    }}
                  />
                </Grid>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Grid item xs={12} lg={4}>
                  <TextField
                    label="No. of laps"
                    type="number"
                    value={
                      props.store.gameSettings.numberOfLaps
                        ? props.store.gameSettings.numberOfLaps
                        : ""
                    }
                    onChange={(ev) => {
                      updateGameSettings("numberOfLaps", +ev.target.value);
                    }}
                    style={{
                      backgroundColor: inputBackgroundColor,
                    }}
                  />
                </Grid>
              </React.Fragment>
            )}
            <Grid item xs={12} lg={4}>
              <TrackSelect
                gameType={props.store.gameSettings.gameType}
                excludedTracks={["town-track", "test-course"]}
                value={props.store.gameSettings.trackName}
                onChange={(newTrackName) => {
                  updateGameSettings("trackName", newTrackName);
                }}
                showMapPreview
              />
            </Grid>
            <Grid item xs={12}>
              {props.store.gameSettings.gameType === "tag" && (
                <TagRulesComponent />
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default GameSettingsComponent;
