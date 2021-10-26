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
}

const ControllerSettingsComponent = (props: IControllerSettingsComponent) => {
  const user = props.user;

  const [userSettings, setUserSettings] = useState(undefined);

  const saveUserSettingsToBD = (newUserSettings: IUserSettings) => {
    if (user) {
      setDBUserSettings(user.uid, newUserSettings);
      props.socket.emit("settings-changed", newUserSettings);
    }
  };

  useEffect(() => {
    if (user) {
      getDBUserSettings(user.uid, (settings) => {
        if (!settings) {
          setDBUserSettings(user.uid, defaultUserSettings);
          setUserSettings(defaultUserSettings);
        } else {
          /** For development, when I change the vehicle settings the keys of the old settings need to be updated */
          const newVehicleSettings = {};
          const oldVehicleSettings = settings.vehicleSettings;
          let wasKeyChange = false;
          for (let defKey of Object.keys(defaultVehicleSettings)) {
            if (!(defKey in oldVehicleSettings)) {
              newVehicleSettings[defKey] = defaultVehicleSettings[defKey];
              wasKeyChange = true;
            } else {
              newVehicleSettings[defKey] = oldVehicleSettings[defKey];
            }
          }
          const newUserSettings = {
            ...settings,
            vehicleSettings: newVehicleSettings,
          } as IUserSettings;
          if (wasKeyChange) {
            setDBUserSettings(user.uid, newUserSettings);
          }

          setUserSettings(newUserSettings);
          // send to the game
          setTimeout(() => {
            props.socket.emit("settings-changed", settings);
          }, 2000);
        }
      });
    }
  }, [user]);

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

  if (!userSettings) {
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
              ...userSettings.vehicleSettings,
              useChaseCamera: !userSettings.vehicleSettings.useChaseCamera,
            } as IVehicleSettings;
            const newUserSettings = {
              ...userSettings,
              vehicleSettings: newVehicleSettings,
            };
            setUserSettings(newUserSettings);
            saveUserSettingsToBD(newUserSettings);
          }}
        >
          Camera chaser{" "}
          {userSettings.vehicleSettings.useChaseCamera ? "On" : "Off"}
        </Button>
      </Grid>
      <Grid item xs={12}>
        <span>Chase camera speed</span>
        <Slider
          min={0.01}
          max={1}
          valueLabelDisplay="auto"
          step={0.01}
          value={userSettings.vehicleSettings.chaseCameraSpeed}
          onChange={(e, value) => {
            const newVehicleSettings = {
              ...userSettings.vehicleSettings,
              chaseCameraSpeed: value,
            } as IVehicleSettings;
            const newUserSettings = {
              ...userSettings,
              vehicleSettings: newVehicleSettings,
            };
            setUserSettings(newUserSettings);
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
          value={userSettings.vehicleSettings.steeringSensitivity}
          onChange={(e, value) => {
            const newVehicleSettings = {
              ...userSettings.vehicleSettings,
              steeringSensitivity: value,
            } as IVehicleSettings;
            const newUserSettings = {
              ...userSettings,
              vehicleSettings: newVehicleSettings,
            };
            setUserSettings(newUserSettings);
            saveUserSettingsToBD(newUserSettings);
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
