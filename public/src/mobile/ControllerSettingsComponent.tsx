import CloseIcon from "@mui/icons-material/Close";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import {
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Grid,
  IconButton,
  Slider,
} from "@mui/material";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Socket } from "socket.io-client";
import { IUserSettings, IVehicleSettings } from "../classes/User";
import NotLoggedInModal from "../components/NotLoggedInModal";
import { frontPagePath } from "../components/Routes";
import { IStore } from "../components/store";
import { IUser, setDBUserSettings } from "../firebase/firebaseFunctions";
import { mts_user_settings_changed } from "../shared-backend/shared-stuff";

export const invertedControllerKey = "invertedController";

interface IControllerSettingsComponent {
  setSettingsModalOpen: any;
  onClose: () => void;

  userLoggedIn: () => void;
  resetOrientation: () => void;
  socket: Socket;
  user: IUser;
  store: IStore;
}

const ControllerSettingsComponent = (props: IControllerSettingsComponent) => {
  const user = props.user;

  const [chaseSpeedDefaultVal, setChaseSpeedDefaultVal] = useState(
    props.store.userSettings.vehicleSettings.chaseCameraSpeed
  );

  const [steerSenceDefaultVal, setSteerSenceDefaultVal] = useState(
    props.store.userSettings.vehicleSettings.steeringSensitivity
  );

  const saveUserSettingsToBD = (newUserSettings: IUserSettings) => {
    if (user) {
      setDBUserSettings(user.uid, newUserSettings);
      props.socket.emit(mts_user_settings_changed, newUserSettings);
      props.store.setUserSettings(newUserSettings);
    }
  };

  if (!user) {
    return (
      <NotLoggedInModal
        onClose={props.onClose}
        infoText="To set user settings, you need to be logged in."
        onContinoueAsGuest={props.onClose}
        open
        signInWithPopup
      />
    );
  }

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
        <IconButton onClick={() => props.setSettingsModalOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Grid>
      <Grid item xs={6}>
        <Button variant="outlined" onClick={props.resetOrientation}>
          Reset orientation
        </Button>
      </Grid>
      <Grid item xs={6}>
        <Button
          variant="outlined"
          onClick={() => {
            const newVehicleSettings = {
              ...props.store.userSettings.vehicleSettings,
              useChaseCamera:
                !props.store.userSettings.vehicleSettings.useChaseCamera,
            } as IVehicleSettings;
            const newUserSettings = {
              ...props.store.userSettings,
              vehicleSettings: newVehicleSettings,
            } as IUserSettings;
            props.store.setUserSettings(newUserSettings);
            saveUserSettingsToBD(newUserSettings);
          }}
        >
          Camera chaser{" "}
          {props.store.userSettings.vehicleSettings.useChaseCamera
            ? "On"
            : "Off"}
        </Button>
      </Grid>
      <Grid item xs={12}>
        <span>Chase camera speed</span>
        <Slider
          min={0.01}
          max={1}
          valueLabelDisplay="auto"
          step={0.01}
          defaultValue={chaseSpeedDefaultVal}
          onChange={(e, value) => {}}
          onChangeCommitted={(e, value) => {
            const newVehicleSettings = {
              ...props.store.userSettings.vehicleSettings,
              chaseCameraSpeed: value,
            } as IVehicleSettings;
            const newUserSettings = {
              ...props.store.userSettings,
              vehicleSettings: newVehicleSettings,
            };
            props.store.setUserSettings(newUserSettings);

            saveUserSettingsToBD(newUserSettings);
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <span>Steering sensitivity</span>
        <Slider
          min={0.01}
          max={2}
          valueLabelDisplay="auto"
          step={0.01}
          defaultValue={steerSenceDefaultVal}
          onChange={(e, value) => {}}
          onChangeCommitted={(e, value) => {
            const newVehicleSettings: IVehicleSettings = {
              ...props.store.userSettings.vehicleSettings,
              steeringSensitivity: value as number,
            };
            const newUserSettings = {
              ...props.store.userSettings,
              vehicleSettings: newVehicleSettings,
            };
            props.store.setUserSettings(newUserSettings);
            saveUserSettingsToBD(newUserSettings);
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
