import {
  Card,
  CardContent,
  CardHeader,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
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
  socket: Socket;
  store: IStore;
  userId: string | undefined;
}

const GameSettingsComponent = (props: IGameSettingsComponent) => {
  const history = useHistory();

  useEffect(() => {
    props.socket.on(stmd_game_settings_changed, (data) => {
      props.store.setGameSettings(data.gameSettings);
    });
    return () => {
      props.socket.off(stmd_game_settings_changed);
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

    props.socket.emit(mdts_game_settings_changed, {
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
            <Grid item xs={12}>
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
                <Grid item xs={false} sm={4} xl={5} />
                <Grid item xs={12} sm={4} xl={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Tag game length in minutes"
                    value={props.store.gameSettings.tagGameLength}
                    style={{ backgroundColor: inputBackgroundColor }}
                    onChange={(ev) => {
                      updateGameSettings("tagGameLength", +ev.target.value);
                    }}
                  />
                </Grid>
                <Grid item xs={false} sm={4} xl={5} />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Grid item xs={12}>
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
            <Grid item xs={12}>
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
