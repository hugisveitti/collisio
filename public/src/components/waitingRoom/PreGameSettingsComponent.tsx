import {
  MenuItem,
  Select,
  TextField,
  Grid,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  InputLabel,
  CardContent,
  Card,
  CardHeader,
} from "@mui/material";
import React from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import { Socket } from "socket.io-client";
import {
  defaultRaceTrack,
  defaultTagTrack,
  IPreGameSettings,
} from "../../classes/Game";
import { IUserSettings } from "../../classes/User";
import { setDBUserSettings } from "../../firebase/firebaseFunctions";
import { inputBackgroundColor } from "../../providers/theme";
import TrackSelect from "../inputs/TrackSelect";
import { IStore } from "../store";

interface IPreGameSettingsComponent {
  socket: Socket;
  store: IStore;
  userId: string | undefined;
}

const GameSettingsComponent = (props: IPreGameSettingsComponent) => {
  const history = useHistory();

  const updateGameSettings = (key: keyof IPreGameSettings, value: any) => {
    const newPreGameSettings = { ...props.store.preGameSettings };
    // @ts-ignore
    newPreGameSettings[key] = value;

    if (key === "gameType") {
      if (value === "tag") {
        newPreGameSettings.trackName = defaultTagTrack;
      } else if (value === "race") {
        newPreGameSettings.trackName = defaultRaceTrack;
      }
    }

    const newUserSettings: IUserSettings = {
      ...props.store.userSettings,
      preGameSettings: newPreGameSettings,
    };

    props.store.setUserSettings(newUserSettings);

    props.store.setPreGameSettings(newPreGameSettings);

    props.socket.emit("game-settings-changed", {
      gameSettings: newPreGameSettings,
    });

    if (props.userId) {
      setDBUserSettings(props.userId, newUserSettings);
    }
  };

  return (
    <Grid item xs={12}>
      <Card
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
                        checked={
                          props.store.preGameSettings.gameType === "race"
                        }
                      />
                    }
                    label="Race"
                  />
                  <FormControlLabel
                    value="tag"
                    control={
                      <Radio
                        onChange={() => {
                          //updateGameSettings("gameType", "tag")}
                          toast("Tag game not available yet");
                        }}
                        checked={props.store.preGameSettings.gameType === "tag"}
                      />
                    }
                    label="Tag"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            {props.store.preGameSettings.gameType === "tag" ? (
              <React.Fragment>
                <Grid item xs={false} sm={4} xl={5} />
                <Grid item xs={12} sm={4} xl={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Tag game length in minutes"
                    value={props.store.preGameSettings.ballRadius}
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
                <Grid item xs={false} sm={4} xl={5} />
                <Grid item xs={12} sm={3} xl={2}>
                  <TextField
                    label="No. of laps"
                    type="number"
                    value={props.store.preGameSettings.numberOfLaps}
                    onChange={(ev) => {
                      updateGameSettings("numberOfLaps", +ev.target.value);
                    }}
                    style={{
                      backgroundColor: inputBackgroundColor,
                    }}
                  />
                </Grid>
                <Grid item xs={false} sm={4} xl={5} />
              </React.Fragment>
            )}
            <Grid item xs={12}>
              <TrackSelect
                gameType={props.store.preGameSettings.gameType}
                excludedTracks={["town-track", "test-course"]}
                value={props.store.preGameSettings.trackName}
                onChange={(newTrackName) => {
                  updateGameSettings("trackName", newTrackName);
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default GameSettingsComponent;
