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
import { Socket } from "socket.io-client";
import { IPreGameSettings } from "../classes/Game";
import { IUserSettings } from "../classes/User";
import { setDBUserSettings } from "../firebase/firebaseFunctions";
import { inputBackgroundColor } from "../providers/theme";
import { IStore } from "./store";

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
                    value="ball"
                    control={
                      <Radio
                        onChange={() => updateGameSettings("gameType", "ball")}
                        checked={
                          props.store.preGameSettings.gameType === "ball"
                        }
                      />
                    }
                    label="Ball"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            {props.store.preGameSettings.gameType === "ball" ? (
              <React.Fragment>
                <Grid item xs={false} sm={4} xl={5} />
                <Grid item xs={12} sm={4} xl={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Ball radius"
                    value={props.store.preGameSettings.ballRadius}
                    style={{ backgroundColor: inputBackgroundColor }}
                    onChange={(ev) => {
                      updateGameSettings("ballRadius", +ev.target.value);
                    }}
                  />
                </Grid>
                <Grid item xs={false} sm={4} xl={5} />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Grid item xs={false} sm={3} xl={4} />
                <Grid item xs={12} sm={3} xl={2}>
                  <TextField
                    fullWidth
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
                <Grid item xs={12} sm={3} xl={2}>
                  <FormControl fullWidth>
                    <InputLabel id="track-select">Track selection</InputLabel>
                    <Select
                      style={{
                        backgroundColor: inputBackgroundColor,
                      }}
                      label="Track selection"
                      name="race-track"
                      onChange={(e) => {
                        updateGameSettings("trackName", e.target.value);
                      }}
                      value={props.store.preGameSettings.trackName}
                    >
                      <MenuItem value="low-poly-farm-track">
                        Farm track
                      </MenuItem>
                      <MenuItem value="low-poly-f1-track">F1 track</MenuItem>
                      {/* <MenuItem value="track">Simple track</MenuItem>
                      <MenuItem value="town-track">Town track</MenuItem> */}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={false} sm={3} xl={4} />
              </React.Fragment>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default GameSettingsComponent;
