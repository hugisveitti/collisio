import CloseIcon from "@mui/icons-material/Close";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Socket } from "socket.io-client";
import { nonActiveTrackNames } from "../classes/Game";
import {
  IGameSettings,
  setLocalGameSetting,
} from "../classes/localGameSettings";
import { IUserSettings, IVehicleSettings } from "../classes/User";
import TrackSelect from "../components/inputs/TrackSelect";
import VehicleSelect from "../components/inputs/VehicleSelect";
import { frontPagePath } from "../components/Routes";
import { IStore } from "../components/store";
import { IUser, setDBUserSettings } from "../firebase/firebaseFunctions";
import {
  GameActions,
  mts_user_settings_changed,
} from "../shared-backend/shared-stuff";
import { nonactiveVehcileTypes } from "../vehicles/VehicleConfigs";

export const invertedControllerKey = "invertedController";

interface IControllerSettingsComponent {
  onClose: () => void;

  userLoggedIn: () => void;
  resetOrientation: () => void;
  socket: Socket;
  user: IUser;
  store: IStore;
  gameActions: GameActions;
  sendGameActions: () => void;
}

const ControllerSettingsComponent = (props: IControllerSettingsComponent) => {
  const user = props.user;

  const [chaseSpeedDefaultVal, setChaseSpeedDefaultVal] = useState(
    props.store.userSettings.vehicleSettings.chaseCameraSpeed
  );

  const [steerSenceDefaultVal, setSteerSenceDefaultVal] = useState(
    props.store.userSettings.vehicleSettings.steeringSensitivity
  );

  const [numberOfLaps, setNumberOfLaps] = useState(0);

  const saveUserSettingsToBD = (newUserSettings: IUserSettings) => {
    if (user) {
      setDBUserSettings(user.uid, newUserSettings);
      props.socket.emit(mts_user_settings_changed, newUserSettings);
      props.store.setUserSettings(newUserSettings);
    }
  };

  const updateSettings = (key: keyof IGameSettings, value: any) => {
    const newGameSettings = props.store.gameSettings;

    // @ts-ignore
    newGameSettings[key] = value;
    setLocalGameSetting(key, value);
  };

  const updateVehicleSettings = (key: keyof IVehicleSettings, value: any) => {
    const newVehicleSettings = {
      ...props.store.userSettings.vehicleSettings,
    } as IVehicleSettings;

    // @ts-ignore
    newVehicleSettings[key] = value;

    const newUserSettings = {
      ...props.store.userSettings,
      vehicleSettings: newVehicleSettings,
    } as IUserSettings;
    props.store.setUserSettings(newUserSettings);
    saveUserSettingsToBD(newUserSettings);
  };

  if (!props.store.userSettings) {
    return (
      <div style={{ margin: "auto", marginTop: 15, textAlign: "center" }}>
        <CircularProgress />
      </div>
    );
  }
  /** Add reset orientation device */
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} style={{ textAlign: "right" }}>
        <IconButton onClick={() => props.onClose()}>
          <CloseIcon />
        </IconButton>
      </Grid>
      {props.store.player.isLeader && (
        <>
          <Grid item xs={6} sm={4}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                props.gameActions.restart = true;
                props.sendGameActions();
                /**
                 * is this a hacky way to set restart to false?
                 */
                setTimeout(() => {
                  props.gameActions.restart = false;
                  props.onClose();
                }, 150);
              }}
            >
              Restart Game
            </Button>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                props.gameActions.toggleSound = true;
                props.sendGameActions();
                /**
                 * is this a hacky way to set restart to false?
                 */
                setTimeout(() => {
                  props.gameActions.toggleSound = false;
                }, 150);
              }}
            >
              Toggle sound
            </Button>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                props.gameActions.toggleShadows = true;
                props.sendGameActions();
                /**
                 * is this a hacky way to set restart to false?
                 */
                setTimeout(() => {
                  props.gameActions.toggleShadows = false;
                }, 150);
              }}
            >
              Toggle shadows
            </Button>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography>
              To update the track selection you must restart the game.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TrackSelect
              showMapPreview={false}
              value={props.store.gameSettings.trackName}
              excludedTracks={nonActiveTrackNames}
              gameType={props.store.gameSettings.gameType}
              onChange={(value) => {
                props.gameActions.changeTrack = value;
                props.sendGameActions();

                updateSettings("trackName", value);
                setTimeout(() => {
                  props.gameActions.changeTrack = undefined;
                }, 150);

                const newGameSettings: IGameSettings = {
                  ...props.store.gameSettings,
                  trackName: value,
                };
                props.store.setGameSettings(newGameSettings);
              }}
            />
          </Grid>

          <Grid item xs={6} sm={4}>
            <TextField
              value={numberOfLaps ? numberOfLaps : ""}
              type="number"
              label="No. of laps"
              onChange={(e) => setNumberOfLaps(+e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <Button
              disableElevation
              variant="contained"
              onClick={() => {
                props.gameActions.numberOfLaps = numberOfLaps;
                props.sendGameActions();
                setTimeout(() => {
                  props.gameActions.numberOfLaps = undefined;
                  // setNumberOfLaps(0)
                }, 150);
              }}
            >
              Send number of laps
            </Button>
          </Grid>
        </>
      )}
      <Grid item xs={12}>
        <Divider variant="middle" />
      </Grid>
      <Grid item xs={6} sm={4}>
        <Button fullWidth variant="outlined" onClick={props.resetOrientation}>
          Reset orientation
        </Button>
      </Grid>
      <Grid item xs={6} sm={4}>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => {
            updateVehicleSettings(
              "useChaseCamera",
              !props.store.userSettings.vehicleSettings.useChaseCamera
            );
          }}
        >
          Camera chaser{" "}
          {props.store.userSettings.vehicleSettings.useChaseCamera
            ? "On"
            : "Off"}
        </Button>
      </Grid>

      <Grid item xs={12}>
        <Typography>Chase camera speed</Typography>
        <Slider
          min={0.01}
          max={1}
          valueLabelDisplay="auto"
          step={0.01}
          defaultValue={chaseSpeedDefaultVal}
          onChange={(e, value) => {}}
          onChangeCommitted={(e, value) => {
            updateVehicleSettings("chaseCameraSpeed", value);
          }}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography>Steering sensitivity</Typography>
        <Slider
          min={0.01}
          max={2}
          valueLabelDisplay="auto"
          step={0.01}
          defaultValue={steerSenceDefaultVal}
          onChange={(e, value) => {}}
          onChangeCommitted={(e, value) => {
            updateVehicleSettings("steeringSensitivity", value);
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <Typography>
          For the vehicle type to update, the leader must restart the game.
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <VehicleSelect
          value={props.store.userSettings.vehicleSettings.vehicleType}
          excludedVehicles={nonactiveVehcileTypes}
          onChange={(value) => {
            updateVehicleSettings("vehicleType", value);
          }}
        />
      </Grid>

      <Grid item xs={12}></Grid>

      <Grid item xs={12} style={{ textAlign: "center" }}>
        <Link to={frontPagePath} style={{ textDecoration: "none" }}>
          <Button startIcon={<ExitToAppIcon />}>Quit game</Button>
        </Link>
      </Grid>
    </Grid>
  );
};

export default ControllerSettingsComponent;
