import VolumeDown from "@mui/icons-material/VolumeDown";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUp from "@mui/icons-material/VolumeUp";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import Collapse from "@mui/material/Collapse";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  defaultRaceTrack,
  defaultStoryTrack,
  defaultTagTrack,
  getTrackNameFromType,
  nonActiveTrackNames,
  numberOfLapsPossibilities,
} from "../../classes/Game";
import {
  GraphicsType,
  IGameSettings,
  setLocalGameSetting,
} from "../../classes/localGameSettings";
import { getFastestGhostFilename } from "../../firebase/firebaseStorageFunctions";
import { getStyledColors } from "../../providers/theme";
import { GameType } from "../../shared-backend/shared-stuff";
import { setMusicVolume } from "../../sounds/gameSounds";
import { DriveRecorder } from "../../test-courses/GhostDriver";
import { getDeviceType, inTestMode } from "../../utils/settings";
import BackdropButton from "../button/BackdropButton";
import MyCheckbox from "../inputs/checkbox/MyCheckbox";
import CollabsibleCard from "../inputs/CollapsibleCard";
import InfoButton from "../inputs/info-button/InfoButton";
import NumberSelect from "../inputs/NumberSelect";
import MySlider from "../inputs/slider/MySlider";
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

  const onMobile = getDeviceType() === "mobile";

  const { color, backgroundColor } = getStyledColors("black");

  const [gettingGhost, setGettingGhost] = useState(false);

  const updateGameSettingsBatch = (
    keys: (keyof IGameSettings)[],
    values: any[]
  ) => {
    const newGameSettings = { ...props.gameSettings };
    for (let i = 0; i < keys.length; i++) {
      // @ts-ignore
      newGameSettings[keys[i]] = values[i];

      setLocalGameSetting(keys[i], values[i]);
    }

    setGameSettings(newGameSettings);
    props.onChange(newGameSettings);
  };

  const updateGameSettings = (
    key: keyof IGameSettings,
    value: any,
    _gameSettings?: IGameSettings
  ) => {
    const newGameSettings = _gameSettings
      ? {
          ..._gameSettings,
        }
      : {
          ...props.gameSettings,
        };
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

    if (
      (key === "numberOfLaps" || key === "trackName") &&
      gameSettings.useGhost
    ) {
      handleGetFastestGhost(newGameSettings);
    }
  };
  const handleGetFastestGhost = (_gameSettings: IGameSettings) => {
    getFastestGhostFilename(
      _gameSettings.trackName,
      _gameSettings.numberOfLaps
    ).then((filename) => {
      setGettingGhost(false);

      console.log("got filename", filename);
      if (!filename) {
        toast.warn("No ghost found.");
        updateGameSettings("ghostFilename", "", _gameSettings);
      } else {
        _gameSettings.ghostFilename = filename;
        updateGameSettings("ghostFilename", filename, _gameSettings);
      }
    });
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
              <Typography>Sound effects</Typography>
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
              <MySlider
                startIcon={
                  <IconButton
                    style={{ color: "black" }}
                    onClick={() => {
                      updateGameSettings("musicVolume", 0);
                    }}
                  >
                    <VolumeDown />
                  </IconButton>
                }
                endIcon={<VolumeUp />}
                label="Music volume"
                onChangeCommitted={(newVal) => {
                  updateGameSettings("musicVolume", newVal);
                }}
                onChange={(newVal) => {
                  if (!onMobile) {
                    setMusicVolume(newVal as number);
                  }
                }}
                value={gameSettings.musicVolume}
                step={0.01}
                max={1}
                min={0}
                color="black"
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

            <Grid item xs={12}>
              <Collapse in={props.gameSettings.useGhost}>
                <MyTextField
                  value={props.gameSettings.ghostFilename}
                  label="Ghost filename"
                  disabled={!!props.gameSettings.tournamentId}
                  onChange={(e) =>
                    updateGameSettings("ghostFilename", e.target.value)
                  }
                  onBlur={() => {
                    const { trackName, numberOfLaps } =
                      DriveRecorder.GetTrackNameNumberOfLapsFromFilename(
                        props.gameSettings.ghostFilename
                      );
                    console.log(
                      "updating number of laps and track name",
                      props.gameSettings.ghostFilename,
                      trackName,
                      numberOfLaps
                    );
                    if (trackName && numberOfLaps) {
                      updateGameSettingsBatch(
                        ["trackName", "numberOfLaps"],
                        [trackName, numberOfLaps]
                      );
                      //   updateGameSettings("numberOfLaps", numberOfLaps, true);
                    }
                  }}
                />
                <br />
                <BackdropButton
                  onClick={async () => {
                    // updateGameSettings("useGhost", true);
                    setGettingGhost(true);
                    handleGetFastestGhost(gameSettings);
                  }}
                  disabled={gettingGhost}
                  loading={gettingGhost}
                >
                  Find quickest ghost
                </BackdropButton>
                <InfoButton
                  infoText={`Click the button to play against the fastest player that recorded their try playing ${getTrackNameFromType(
                    props.gameSettings.trackName
                  )} for ${props.gameSettings.numberOfLaps} laps.`}
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
