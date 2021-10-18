import CloseIcon from "@mui/icons-material/Close";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import {
  Button,
  CircularProgress,
  Grid,
  IconButton,
  TextField,
} from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Socket } from "socket.io-client";
import { defaultUserSettings, IVehicleSettings } from "../classes/User";
import NotLoggedInModal from "../components/NotLoggedInModal";
import { frontPagePath } from "../components/Routes";
import {
  getDBUserSettings,
  setDBUserSettings,
} from "../firebase/firebaseFunctions";
import { auth } from "../firebase/firebaseInit";
import { UserContext } from "../providers/UserProvider";

interface IControllerSettingsComponent {
  setSettingsModalOpen: any;
  onClose: () => void;

  userLoggedIn: () => void;
  resetOrientation: () => void;
  socket: Socket;
}

const ControllerSettingsComponent = (props: IControllerSettingsComponent) => {
  const user = useContext(UserContext);

  const [userSettings, setUserSettings] = useState(undefined);

  const saveUserSettingsToBD = () => {
    if (user) {
      setDBUserSettings(user.uid, userSettings);
      props.socket.emit("settings-changed", userSettings);
    }
  };

  useEffect(() => {
    auth.onAuthStateChanged((userAuth) => {
      console.log("user auth");
      if (user) {
        props.userLoggedIn();
      }
    });
  }, []);

  useEffect(() => {
    if (user) {
      getDBUserSettings(user.uid, (settings) => {
        if (!settings) {
          setDBUserSettings(user.uid, defaultUserSettings);
          setUserSettings(defaultUserSettings);
        } else {
          setUserSettings(settings);
          // send to the game
          console.log("settings", settings);
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
      <Grid item xs={6} />
      <Grid item xs={6}>
        <TextField
          fullWidth
          type="number"
          label="Steering sense"
          defaultValue={userSettings.vehicleSettings.steeringSensitivity}
          onChange={(e) => {
            const newVehicleSettings = {
              ...userSettings.vehicleSettings,
              steeringSensitivity: +e.target.value,
            } as IVehicleSettings;
            const newUserSettings = {
              ...userSettings,
              vehicleSettings: newVehicleSettings,
            };
            setUserSettings(newUserSettings);
          }}
          onBlur={saveUserSettingsToBD}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          type="number"
          label="Engine force"
          defaultValue={userSettings.vehicleSettings.engineForce}
          onChange={(e) => {
            const newVehicleSettings = {
              ...userSettings.vehicleSettings,
              engineForce: +e.target.value,
            };
            const newUserSettings = {
              ...userSettings,
              vehicleSettings: newVehicleSettings,
            };
            setUserSettings(newUserSettings);
          }}
          onBlur={saveUserSettingsToBD}
        />
      </Grid>
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
