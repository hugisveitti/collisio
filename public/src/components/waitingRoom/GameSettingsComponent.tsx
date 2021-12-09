import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";
import React, { useEffect, useState } from "react";
import {
  defaultRaceTrack,
  defaultTagTrack,
  nonActiveTrackNames,
} from "../../classes/Game";
import {
  IGameSettings,
  setLocalGameSetting,
} from "../../classes/localGameSettings";
import { inputBackgroundColor } from "../../providers/theme";
import { inTestMode } from "../../utils/settings";
import TrackSelect from "../inputs/TrackSelect";

interface IGameSettingsComponent {
  gameSettings: IGameSettings;
  onChange: (gameSettings: IGameSettings) => void;
  inTestMode?: boolean;
}

const GameSettingsComponent = (props: IGameSettingsComponent) => {
  const [gameSettings, setGameSettings] = useState(props.gameSettings);

  const updateGameSettings = (key: keyof IGameSettings, value: any) => {
    const newGameSettings = { ...props.gameSettings };
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

    setGameSettings(newGameSettings);
    props.onChange(newGameSettings);
  };

  useEffect(() => {
    setGameSettings(props.gameSettings);
  }, [props.gameSettings]);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={4}>
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
                  checked={gameSettings.gameType === "race"}
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
                  }}
                  checked={gameSettings.gameType === "tag"}
                />
              }
              label="Tag"
            />
          </RadioGroup>
        </FormControl>
      </Grid>
      {gameSettings.gameType === "tag" ? (
        <React.Fragment>
          <Grid item xs={6} lg={4} xl={4}>
            <TextField
              type="number"
              label="Tag game length in minutes"
              value={
                gameSettings.tagGameLength ? gameSettings.tagGameLength : ""
              }
              style={{ backgroundColor: inputBackgroundColor }}
              onChange={(ev) => {
                updateGameSettings("tagGameLength", +ev.target.value);
              }}
            />
          </Grid>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Grid item xs={12} lg={4} xl={4}>
            <TextField
              label="No. of laps"
              type="number"
              value={gameSettings.numberOfLaps ? gameSettings.numberOfLaps : ""}
              onChange={(ev) => {
                if (+ev.target.value > 0) {
                  updateGameSettings("numberOfLaps", +ev.target.value);
                }
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
          gameType={gameSettings.gameType}
          excludedTracks={
            props.inTestMode || inTestMode ? [] : nonActiveTrackNames
          }
          value={gameSettings.trackName}
          onChange={(newTrackName) => {
            updateGameSettings("trackName", newTrackName);
          }}
          showMapPreview
        />
      </Grid>
      <Grid item xs={6} sm={4}>
        <IconButton
          onClick={() => {
            updateGameSettings("useSound", !gameSettings.useSound);
          }}
        >
          {gameSettings.useSound ? <VolumeUpIcon /> : <VolumeOffIcon />}
        </IconButton>
      </Grid>
      <Grid item xs={6} sm={4}>
        <Button
          variant="contained"
          onClick={() => {
            updateGameSettings("useShadows", !gameSettings.useShadows);
          }}
        >
          Shadows {gameSettings.useShadows ? "On" : "Off"}
        </Button>
      </Grid>
    </Grid>
  );
};

export default GameSettingsComponent;
