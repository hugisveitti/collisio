import { PlayLessonRounded } from "@mui/icons-material";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import { Checkbox, Collapse } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import {
  activeGameTypes,
  defaultRaceTrack,
  defaultStoryTrack,
  defaultTagTrack,
  nonActiveTrackNames,
  numberOfLapsPossibilities,
} from "../../classes/Game";
import {
  IGameSettings,
  setLocalGameSetting,
} from "../../classes/localGameSettings";
import { inputBackgroundColor } from "../../providers/theme";
import { inTestMode } from "../../utils/settings";
import { itemInArray } from "../../utils/utilFunctions";
import CollabsibleCard from "../inputs/CollapsibleCard";
import NumberSelect from "../inputs/NumberSelect";
import TrackSelect from "../inputs/TrackSelect";

interface IGameSettingsComponent {
  gameSettings: IGameSettings;
  onChange: (gameSettings: IGameSettings) => void;
  inTestMode?: boolean;
}

const GameSettingsComponent = (props: IGameSettingsComponent) => {
  const [gameSettings, setGameSettings] = useState(props.gameSettings);
  const [drawDistanceDefaultVal, setDrawDistanceDefaultVal] = useState(
    props.gameSettings.drawDistance
  );

  const [moreSettingsOpen, setMoreSettingsOpen] = useState(false);

  const updateGameSettings = (key: keyof IGameSettings, value: any) => {
    const newGameSettings = { ...props.gameSettings };
    // @ts-ignore
    newGameSettings[key] = value;

    if (key === "gameType") {
      if (value === "tag") {
        newGameSettings.trackName = defaultTagTrack;
      } else if (value === "race") {
        newGameSettings.trackName = defaultRaceTrack;
      } else if (value === "story") {
        newGameSettings.trackName = defaultStoryTrack;
      }
    }

    setLocalGameSetting(key, value);

    setGameSettings(newGameSettings);
    props.onChange(newGameSettings);
  };

  useEffect(() => {
    setGameSettings(props.gameSettings);
  }, [props.gameSettings]);

  const disableInputs = !!props.gameSettings.tournamentId;

  const renderGameTypeInputs = () => {
    if (props.gameSettings.gameType === "race") {
      return (
        <React.Fragment>
          <Grid item xs={12} lg={4} xl={4}>
            <NumberSelect
              disabled={disableInputs}
              title="No. of laps"
              value={gameSettings.numberOfLaps}
              numbers={numberOfLapsPossibilities}
              onChange={(val) => {
                updateGameSettings("numberOfLaps", val);
              }}
              style={{
                backgroundColor: inputBackgroundColor,
              }}
            />
          </Grid>
        </React.Fragment>
      );
    }
    if (props.gameSettings.gameType === "tag") {
      return (
        <React.Fragment>
          <Grid item xs={12} lg={4} xl={4}>
            <TextField
              disabled={disableInputs}
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
      );
    }

    return null;
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={4}>
        <FormControl component="fieldset" disabled={disableInputs}>
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
            {itemInArray("story", activeGameTypes) && (
              <FormControlLabel
                value="story"
                control={
                  <Radio
                    onChange={() => {
                      updateGameSettings("gameType", "story");
                    }}
                    checked={gameSettings.gameType === "story"}
                  />
                }
                label="Story"
              />
            )}
          </RadioGroup>
        </FormControl>
      </Grid>
      {renderGameTypeInputs()}
      <Grid item xs={12} lg={4}>
        <TrackSelect
          disabled={disableInputs}
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
      <Grid item xs={12}>
        <CollabsibleCard header="More settings">
          <Grid container spacing={3}>
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
              <FormControl component="fieldset">
                <FormLabel component="legend">Shadows</FormLabel>
                <RadioGroup
                  row
                  aria-label="shadows"
                  name="row-radio-buttons-group"
                >
                  <FormControlLabel
                    value={false}
                    control={
                      <Radio
                        onChange={() => updateGameSettings("useShadows", false)}
                        checked={!gameSettings.useShadows}
                      />
                    }
                    label="Off"
                  />
                  <FormControlLabel
                    value={true}
                    control={
                      <Radio
                        onChange={() => updateGameSettings("useShadows", true)}
                        checked={gameSettings.useShadows}
                      />
                    }
                    label="On"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Graphics</FormLabel>
                <RadioGroup
                  row
                  aria-label="graphics"
                  name="row-radio-buttons-group"
                >
                  <FormControlLabel
                    value="low"
                    control={
                      <Radio
                        onChange={() => {
                          updateGameSettings("graphics", "low");
                          //   updateGameSettings("useShadows", false);
                        }}
                        checked={gameSettings.graphics === "low"}
                      />
                    }
                    label="Low"
                  />
                  <FormControlLabel
                    value="high"
                    control={
                      <Radio
                        onChange={() => updateGameSettings("graphics", "high")}
                        checked={gameSettings.graphics === "high"}
                      />
                    }
                    label="High"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography>Draw distance</Typography>
              <Slider
                style={{
                  width: "90%",
                }}
                min={50}
                max={7500}
                valueLabelDisplay="auto"
                step={50}
                defaultValue={drawDistanceDefaultVal}
                onChange={(e, value) => {}}
                onChangeCommitted={(e, value) => {
                  updateGameSettings("drawDistance", value);
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                label="Record session?"
                control={
                  <Checkbox
                    value={props.gameSettings.record}
                    onChange={() => {
                      updateGameSettings("record", !props.gameSettings.record);
                    }}
                  />
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                label="Use ghost?"
                control={
                  <Checkbox
                    value={props.gameSettings.useGhost}
                    onChange={() => {
                      updateGameSettings(
                        "useGhost",
                        !props.gameSettings.useGhost
                      );
                    }}
                  />
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Collapse in={props.gameSettings.useGhost}>
                <TextField
                  value={props.gameSettings.ghostFilename}
                  label="Ghost filename"
                  onChange={(e) =>
                    updateGameSettings("ghostFilename", e.target.value)
                  }
                />
              </Collapse>
            </Grid>
          </Grid>
        </CollabsibleCard>
      </Grid>
    </Grid>
  );
};

export default GameSettingsComponent;
