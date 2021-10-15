import {
  MenuItem,
  Select,
  TextField,
  Grid,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  InputLabel,
} from "@mui/material";
import React, { useEffect } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import { Socket } from "socket.io-client";
import { ISocketCallback } from "../utils/connectSocket";
import { startGameAuto } from "../utils/settings";
import { gameRoomPath } from "./Routes";
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

  const handleStartGame = () => {
    props.socket.emit("handle-start-game");
    props.socket.once("handle-start-game-callback", (data: ISocketCallback) => {
      if (data.status === "success") {
        history.push(gameRoomPath);
      } else {
        toast.error(data.message);
      }
    });
  };

  useEffect(() => {
    /***** For development */
    if (startGameAuto) {
      if (props.store.players.length > 0) {
        handleStartGame();
      }
    }
    /****** */
  }, [props.store.players]);
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <h4 className="center">Game settings</h4>
      </Grid>
      {props.store.gameSettings.typeOfGame === "ball" ? (
        <Grid item xs={12}>
          <TextField
            fullWidth
            type="number"
            label="Ball radius"
            value={props.store.gameSettings.ballRadius}
            onChange={(ev) => {
              updateGameSettings("ballRadius", +ev.target.value);
            }}
          />
        </Grid>
      ) : (
        <React.Fragment>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="No. of laps"
              type="number"
              value={props.store.gameSettings.numberOfLaps}
              onChange={(ev) => {
                updateGameSettings("numberOfLaps", +ev.target.value);
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel id="track-select">Track selection</InputLabel>
              <Select
                label="Track selection"
                name="race-track"
                onChange={(e) => {
                  updateGameSettings("trackName", e.target.value);
                }}
                value={props.store.gameSettings.trackName}
              >
                <MenuItem value="track">Simple track</MenuItem>
                <MenuItem value="town-track">Town track</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </React.Fragment>
      )}

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
                  onChange={() => updateGameSettings("typeOfGame", "race")}
                  checked={props.store.gameSettings.typeOfGame === "race"}
                />
              }
              label="Race"
            />
            <FormControlLabel
              value="ball"
              control={
                <Radio
                  onChange={() => updateGameSettings("typeOfGame", "ball")}
                  checked={props.store.gameSettings.typeOfGame === "ball"}
                />
              }
              label="Ball"
            />
          </RadioGroup>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <Button variant="contained" onClick={handleStartGame}>
          Start game
        </Button>
      </Grid>
    </Grid>
  );
};

export default GameSettingsComponent;
