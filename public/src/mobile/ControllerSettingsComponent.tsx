import CloseIcon from "@mui/icons-material/Close";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import React from "react";
import { useHistory } from "react-router";
import { Socket } from "socket.io-client";
import { IUser } from "../classes/User";
import BackdropButton from "../components/button/BackdropButton";
import FullscreenButton from "../components/inputs/FullscreenButton";
import { frontPagePath } from "../components/Routes";
import GameSettingsComponent from "../components/settings/GameSettingsComponent";
import VehicleSettingsComponent from "../components/settings/VehicleSettingsComponent";
import { IStore } from "../components/store";
import { GameActions } from "../shared-backend/shared-stuff";

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
  const history = useHistory();

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
        <IconButton onClick={() => props.onClose()} style={{ color: "white" }}>
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
            <BackdropButton
              color="white"
              onClick={() => {
                props.gameActions.restart = true;
                props.onClose();

                /**
                 * is this a hacky way to set restart to false?
                 */
              }}
            >
              Restart Game
            </BackdropButton>
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
        <BackdropButton
          color="white"
          onClick={() => {
            props.socket.disconnect();
            history.push(frontPagePath);
          }}
          startIcon={<ExitToAppIcon />}
        >
          Quit game
        </BackdropButton>
      </Grid>
    </Grid>
  );
};

export default ControllerSettingsComponent;
