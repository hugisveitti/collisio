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
import { inputBackgroundColor } from "../providers/theme";
import { IStore } from "./store";

interface IGameSettingsComponent {
  socket: Socket;
  store: IStore;
}

const GameSettingsComponent = (props: IGameSettingsComponent) => {
  const history = useHistory();

  const updateGameSettings = (key: string, value: any) => {
    const newGameSettings = { ...props.store.gameSettings };
    newGameSettings[key] = value;
    props.store.setGameSettings(newGameSettings);
    props.socket.emit("game-settings-changed", {
      gameSettings: newGameSettings,
    });
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
                        onChange={() =>
                          updateGameSettings("typeOfGame", "race")
                        }
                        checked={props.store.gameSettings.typeOfGame === "race"}
                      />
                    }
                    label="Race"
                  />
                  <FormControlLabel
                    value="ball"
                    control={
                      <Radio
                        onChange={() =>
                          updateGameSettings("typeOfGame", "ball")
                        }
                        checked={props.store.gameSettings.typeOfGame === "ball"}
                      />
                    }
                    label="Ball"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            {props.store.gameSettings.typeOfGame === "ball" ? (
              <React.Fragment>
                <Grid item xs={false} sm={4} xl={5} />
                <Grid item xs={12} sm={4} xl={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Ball radius"
                    value={props.store.gameSettings.ballRadius}
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
                    value={props.store.gameSettings.numberOfLaps}
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
                      value={props.store.gameSettings.trackName}
                    >
                      <MenuItem value="low-poly-farm-track">
                        Low poly farm track
                      </MenuItem>
                      <MenuItem value="track">Simple track</MenuItem>
                      <MenuItem value="town-track">Town track</MenuItem>
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
