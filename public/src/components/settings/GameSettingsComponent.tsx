import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeDownIcon from "@mui/icons-material/VolumeDown";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { Grid, Typography, IconButton, Tooltip, Collapse } from "@mui/material";
import React, { useEffect, useState } from "react";
import {
  defaultRaceTrack,
  defaultStoryTrack,
  defaultTagTrack,
  getTrackNameFromType,
} from "../../classes/Game";
import {
  BotDifficulty,
  botDifficultyOptions,
  GraphicsType,
  IGameSettings,
  setLocalGameSetting,
} from "../../classes/localGameSettings";
import { getFastestGhostFilename } from "../../firebase/firebaseStorageFunctions";
import { getStyledColors } from "../../providers/theme";
import { setMusicVolume } from "../../sounds/gameSounds";
import { DriveRecorder } from "../../test-courses/GhostDriver";
import { getDeviceType } from "../../utils/settings";
import BackdropButton from "../button/BackdropButton";
import MyCheckbox from "../inputs/checkbox/MyCheckbox";
import InfoButton from "../inputs/info-button/InfoButton";
import MySlider from "../inputs/slider/MySlider";
import MyRadio from "../radio/MyRadio";
import { IStore } from "../store";
import MyTextField from "../textField/MyTextField";
import AnySelect from "../inputs/AnySelect";

interface IGameSettingsComponent {
  gameSettings: IGameSettings;
  onChange: (gameSettings: IGameSettings) => void;
  inTestMode?: boolean;
  store: IStore;
  multiplayer?: boolean;
}

const GameSettingsComponent = (props: IGameSettingsComponent) => {
  const onMobile = getDeviceType() === "mobile";
  const [gameSettings, setGameSettings] = useState(props.gameSettings);

  const { color, backgroundColor } = getStyledColors("black");

  const [gettingGhost, setGettingGhost] = useState(false);

  useEffect(() => {
    if (props.multiplayer) {
      const newGameSettings: IGameSettings = {
        ...gameSettings,
      };

      if (gameSettings.useGhost) {
        newGameSettings.useGhost = false;
      }
      if (gameSettings.record) {
        newGameSettings.record = false;
      }

      setGameSettings(newGameSettings);
      props.onChange(newGameSettings);
    }
  }, []);

  useEffect(() => {
    setGameSettings(props.gameSettings);
  }, [props.gameSettings]);

  // const updateGameSettingsBatch = (
  //   keys: (keyof IGameSettings)[],
  //   values: any[]
  // ) => {
  //   const newGameSettings = { ...props.gameSettings };
  //   for (let i = 0; i < keys.length; i++) {
  //     // @ts-ignore
  //     newGameSettings[keys[i]] = values[i];

  //     setLocalGameSetting(keys[i], values[i]);
  //   }

  //   setGameSettings(newGameSettings);
  //   props.onChange(newGameSettings);
  // };

  const handleGetFastestGhost = (_gameSettings: IGameSettings) => {
    getFastestGhostFilename(
      props.store.roomSettings.trackName,
      props.store.roomSettings.numberOfLaps
    ).then((filename) => {
      setGettingGhost(false);

      if (!filename) {
        // tell people that no ghost was found?
        //     toast.warn("No ghost found.");
        updateGameSettings("ghostFilename", "", _gameSettings);
      } else {
        _gameSettings.ghostFilename = filename;
        updateGameSettings("ghostFilename", filename, _gameSettings);
      }
    });
  };

  const updateGameSettings = (
    key: keyof IGameSettings,
    value: any,
    _gameSettings?: IGameSettings,
    notEmit?: boolean
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

    setLocalGameSetting(key, value);

    setGameSettings(newGameSettings);
    if (!notEmit) {
      props.onChange(newGameSettings);
    }
  };

  return (
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
                if (!onMobile) {
                  setMusicVolume(0 as number);
                }
              }}
            >
              <VolumeDownIcon />
            </IconButton>
          }
          endIcon={<VolumeUpIcon />}
          label="Music volume"
          onChangeCommitted={(newVal) => {
            updateGameSettings("musicVolume", newVal);
          }}
          onChange={(newVal) => {
            updateGameSettings("musicVolume", newVal, undefined, true);
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
        <MySlider
          label="Draw distance"
          //   color="secondary"
          // style={{
          //   width: "90%",
          // }}
          color="black"
          min={50}
          max={7500}
          step={50}
          value={gameSettings.drawDistance}
          onChange={(value) => {
            updateGameSettings(
              "drawDistance",
              value as number,
              undefined,
              true
            );
          }}
          onChangeCommitted={(value) => {
            updateGameSettings("drawDistance", value as number);
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <MySlider
          color="black"
          label="Target FPS"
          max={60}
          min={25} // becomes very unstable at 20 and less
          step={5}
          onChangeCommitted={(newVal) => {
            updateGameSettings("targetFPS", newVal);
          }}
          onChange={(newVal) => {
            updateGameSettings("targetFPS", newVal, undefined, true);
          }}
          value={gameSettings.targetFPS}
        />
      </Grid>
      <Grid item xs={12}>
        <AnySelect<BotDifficulty>
          title="Bot difficulty"
          selectedValue={gameSettings.botDifficulty}
          onChange={(newDiff) => {
            updateGameSettings("botDifficulty", newDiff);
          }}
          options={botDifficultyOptions}
        />
      </Grid>
      {!props.multiplayer && (
        <React.Fragment>
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
            <Tooltip
              style={{ color: backgroundColor }}
              title="Ghost are previously recorded session. So you can race againt the ghost of another player."
            >
              <IconButton>
                <HelpOutlineIcon />
              </IconButton>
            </Tooltip>
          </Grid>

          <Grid item xs={12}>
            <Collapse in={props.gameSettings.useGhost}>
              <MyTextField
                value={props.gameSettings.ghostFilename}
                label="Ghost filename"
                disabled={!!props.store.roomSettings.tournamentId}
                onChange={(e) =>
                  updateGameSettings("ghostFilename", e.target.value)
                }
                onBlur={() => {
                  // const { trackName, numberOfLaps } =
                  //   DriveRecorder.GetTrackNameNumberOfLapsFromFilename(
                  //     props.gameSettings.ghostFilename
                  //   );
                  // if (trackName && numberOfLaps) {
                  //   updateGameSettingsBatch(
                  //     ["trackName", "numberOfLaps"],
                  //     [trackName, numberOfLaps]
                  //   );
                  //   //   updateGameSettings("numberOfLaps", numberOfLaps, true);
                  // }
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
                  props.store.roomSettings.trackName
                )} for ${props.store.roomSettings.numberOfLaps} laps.`}
              />
            </Collapse>
          </Grid>
        </React.Fragment>
      )}
    </Grid>
  );
};

export default GameSettingsComponent;
