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
import CollabsibleCard from "../components/inputs/CollapsibleCard";
import FullscreenButton from "../components/inputs/FullscreenButton";
import { frontPagePath } from "../components/Routes";
import GameSettingsComponent from "../components/settings/GameSettingsComponent";
import RoomSettingsComponent from "../components/settings/RoomSettingsComponent";
import VehicleSettingsComponent from "../components/settings/VehicleSettingsComponent";
import { IStore } from "../components/store";
import { GameActions, mts_quit_game } from "../shared-backend/shared-stuff";
import { disconnectSocket, getSocket } from "../utils/connectSocket";

export const invertedControllerKey = "invertedController";

interface IControllerSettingsComponent {
  onClose: () => void;
  userLoggedIn: () => void;
  resetOrientation: () => void;

  user: IUser;
  store: IStore;
  gameActions: GameActions;
}

const ControllerSettingsComponent = (props: IControllerSettingsComponent) => {
  const user = props.user;
  const history = useHistory();
  const socket = getSocket();

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
        <IconButton onClick={() => props.onClose()} style={{ color: "white" }}>
          <CloseIcon />
        </IconButton>
      </Grid>
      <Grid item xs={6} style={{ textAlign: "right" }}>
        <FullscreenButton />
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
            <RoomSettingsComponent
              roomSettings={props.store.roomSettings}
              onChange={(newRoomSettings) => {
                props.store.setRoomSettings(newRoomSettings);
              }}
              store={props.store}
            />
          </Grid>

          <Grid item xs={12}>
            <CollabsibleCard header="Game Settings">
              <GameSettingsComponent
                gameSettings={props.store.gameSettings}
                onChange={(newGameSettings) => {
                  props.store.setGameSettings(newGameSettings);
                }}
                store={props.store}
              />
            </CollabsibleCard>
          </Grid>
        </>
      )}
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
            console.log("quit game button");
            socket.emit(mts_quit_game, {});
            disconnectSocket();
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
