import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import {
  defaultRaceTrack,
  defaultStoryTrack,
  defaultTagTrack,
  nonActiveTrackNames,
  numberOfLapsPossibilities,
} from "../../classes/Game";
import {
  GraphicsType,
  IGameSettings,
  setLocalGameSetting,
} from "../../classes/localGameSettings";
import { getStyledColors } from "../../providers/theme";
import { GameType } from "../../shared-backend/shared-stuff";
import { inTestMode } from "../../utils/settings";
import MyCheckbox from "../inputs/checkbox/MyCheckbox";
import CollabsibleCard from "../inputs/CollapsibleCard";
import NumberSelect from "../inputs/NumberSelect";
import TrackSelect from "../inputs/TrackSelect";
import MyRadio from "../radio/MyRadio";
import MyTextField from "../textField/MyTextField";

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

  const { color, backgroundColor } = getStyledColors("black");

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
                backgroundColor,
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
            <MyTextField
              disabled={disableInputs}
              type="number"
              label="Tag game length in minutes"
              value={
                gameSettings.tagGameLength ? gameSettings.tagGameLength : ""
              }
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
        <MyRadio<GameType>
          label="Type of game"
          checked={gameSettings.gameType}
          onChange={(newType) => updateGameSettings("gameType", newType)}
          options={[
            { label: "Race", value: "race" },
            { label: "Tag", value: "tag" },
          ]}
          disabled={disableInputs}
        />
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
                style={{ color: backgroundColor }}
                onClick={() => {
                  updateGameSettings("useSound", !gameSettings.useSound);
                }}
              >
                {gameSettings.useSound ? <VolumeUpIcon /> : <VolumeOffIcon />}
              </IconButton>
            </Grid>
            <Grid item xs={6} sm={4}>
              <MyRadio<boolean>
                label="Shadows"
                options={[
                  { label: "Off", value: false },
                  { label: "On", value: true },
                ]}
                checked={gameSettings.useShadows}
                onChange={(newVal) => updateGameSettings("useShadows", newVal)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <MyRadio<GraphicsType>
                label="Graphics"
                checked={gameSettings.graphics}
                options={[
                  { label: "Low", value: "low" },
                  { label: "High", value: "high" },
                ]}
                onChange={(newVal) => updateGameSettings("graphics", newVal)}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography>Draw distance</Typography>
              <Slider
                color="secondary"
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
              <MyCheckbox
                label="Record session?"
                checked={props.gameSettings.record}
                onChange={() => {
                  updateGameSettings("record", !props.gameSettings.record);
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <MyCheckbox
                label="Use ghost?"
                checked={props.gameSettings.useGhost}
                onChange={() => {
                  updateGameSettings("useGhost", !props.gameSettings.useGhost);
                }}
              />
            </Grid>

            {/* <Grid item xs={12}>
              <Collapse in={props.gameSettings.useGhost}>
                <TextField
                  value={props.gameSettings.ghostFilename}
                  label="Ghost filename"
                  onChange={(e) =>
                    updateGameSettings("ghostFilename", e.target.value)
                  }
                />
              </Collapse>
            </Grid> */}
          </Grid>
        </CollabsibleCard>
      </Grid>
    </Grid>
  );
};

export default GameSettingsComponent;
