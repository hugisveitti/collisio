import CloseIcon from "@mui/icons-material/Close";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import {
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Slider,
  TextField,
} from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Socket } from "socket.io-client";
import {
  defaultUserSettings,
  defaultVehicleSettings,
  IUserSettings,
  IVehicleSettings,
} from "../classes/User";
import NotLoggedInModal from "../components/NotLoggedInModal";
import { frontPagePath } from "../components/Routes";
import { IStore } from "../components/store";
import {
  getDBUserSettings,
  IUser,
  setDBUserSettings,
} from "../firebase/firebaseFunctions";

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

  const saveUserSettingsToBD = (newUserSettings: IUserSettings) => {
    if (user) {
      setDBUserSettings(user.uid, newUserSettings);
      props.socket.emit("settings-changed", newUserSettings);
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
      <Grid item xs={12}>
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
          value={props.store.userSettings.vehicleSettings.chaseCameraSpeed}
          onChange={(e, value) => {
            const newVehicleSettings = {
              ...props.store.userSettings.vehicleSettings,
              chaseCameraSpeed: value,
            } as IVehicleSettings;
            const newUserSettings = {
              ...props.store.userSettings,
              vehicleSettings: newVehicleSettings,
            };
            props.store.setUserSettings(newUserSettings);
          }}
          onChangeCommitted={() => {
            saveUserSettingsToBD(props.store.userSettings);
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
          value={props.store.userSettings.vehicleSettings.steeringSensitivity}
          onChange={(e, value) => {
            const newVehicleSettings = {
              ...props.store.userSettings.vehicleSettings,
              steeringSensitivity: value,
            } as IVehicleSettings;
            const newUserSettings = {
              ...props.store.userSettings,
              vehicleSettings: newVehicleSettings,
            };
            props.store.setUserSettings(newUserSettings);
          }}
          onChangeCommitted={() => {
            saveUserSettingsToBD(props.store.userSettings);
          }}
        />
      </Grid>

      <Grid item xs={12}></Grid>

      <Grid item xs={3}></Grid>
      <Grid item xs={9}>
        <Link to={frontPagePath} style={{ textDecoration: "none" }}>
          <Button startIcon={<ExitToAppIcon />}>Quit game</Button>
        </Link>
      </Grid>
    </Grid>
  );
};

export default ControllerSettingsComponent;
