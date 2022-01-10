import CloseIcon from "@mui/icons-material/Close";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { Socket } from "socket.io-client";
import { IUser, IUserSettings, IVehicleSettings } from "../classes/User";
import CollabsibleCard from "../components/inputs/CollapsibleCard";
import FullscreenButton from "../components/inputs/FullscreenButton";
import VehicleSelect from "../components/inputs/VehicleSelect";
import { frontPagePath } from "../components/Routes";
import { IStore } from "../components/store";
import GameSettingsComponent from "../components/settings/GameSettingsComponent";
import { setDBUserSettings } from "../firebase/firestoreFunctions";
import {
  GameActions,
  mts_user_settings_changed,
} from "../shared-backend/shared-stuff";
import { nonactiveVehcileTypes } from "../vehicles/VehicleConfigs";
import VehicleSettingsComponent from "../components/settings/VehicleSettingsComponent";

export const invertedControllerKey = "invertedController";

interface IControllerSettingsComponent {
  onClose: () => void;
  userLoggedIn: () => void;
  resetOrientation: () => void;
  socket: Socket;
  user: IUser;
  store: IStore;
  gameActions: GameActions;
}

const ControllerSettingsComponent = (props: IControllerSettingsComponent) => {
  const user = props.user;

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
      <Grid item xs={6} style={{ textAlign: "left" }}>
        <FullscreenButton />
      </Grid>
      <Grid item xs={6} style={{ textAlign: "right" }}>
        <IconButton onClick={() => props.onClose()}>
          <CloseIcon />
        </IconButton>
      </Grid>
      {props.store.player.isLeader && (
        <>
          <Grid item xs={12} sm={6}>
            <Typography>
              To update the track selection you must restart the game.
            </Typography>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                props.gameActions.restart = true;
                props.onClose();

                /**
                 * is this a hacky way to set restart to false?
                 */
              }}
            >
              Restart Game
            </Button>
          </Grid>
          <Grid item xs={12}>
            <GameSettingsComponent
              gameSettings={props.store.gameSettings}
              onChange={(newGameSettings) => {
                props.store.setGameSettings(newGameSettings);
              }}
            />
          </Grid>
        </>
      )}
      <Grid item xs={12}>
        <Divider variant="middle" />
      </Grid>
      <Grid item xs={12}>
        <VehicleSettingsComponent
          store={props.store}
          user={user}
          resetOrientation={props.resetOrientation}
        />
      </Grid>
      <Grid item xs={12}></Grid>

      <Grid item xs={12} style={{ textAlign: "center" }}>
        <Button
          onClick={() => {
            window.location.href = frontPagePath;
          }}
          startIcon={<ExitToAppIcon />}
        >
          Quit game
        </Button>
      </Grid>
    </Grid>
  );
};

export default ControllerSettingsComponent;
