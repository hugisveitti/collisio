import CloseIcon from "@mui/icons-material/Close";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import React from "react";
import { IGameSettings } from "../../classes/localGameSettings";
import { IUser } from "../../classes/User";
import { IGameScene } from "../../game/IGameScene";
import { IMultiplayerRaceGameScene } from "../../game/MultiplayerRaceGameScene";
import BackdropButton from "../button/BackdropButton";
import FullscreenButton from "../inputs/FullscreenButton";
import VehicleSelect from "../inputs/VehicleSelect";
import BasicDesktopModal from "../modal/BasicDesktopModal";
import { connectPagePath } from "../Routes";
import GameSettingsComponent from "../settings/GameSettingsComponent";
import { IStore } from "../store";

interface IGameSettingsModal {
  open: boolean;
  onClose: () => void;
  gameObject: IMultiplayerRaceGameScene | IGameScene | undefined;
  store: IStore;
  userId: string | undefined;
  isTestMode?: boolean;
  updateGameSettings: (gameSettings: IGameSettings) => void;
  quitGame: (newPath: string) => void;
  user: IUser;
}

const GameSettingsModal = (props: IGameSettingsModal) => {
  if (!props.gameObject) return null;
  return (
    <BasicDesktopModal open={props.open} onClose={props.onClose}>
      <Grid container spacing={3}>
        <Grid item xs={3} style={{ textAlign: "left" }}>
          <FullscreenButton />
        </Grid>
        <Grid item xs={6} style={{ textAlign: "center" }}>
          <Typography variant="h6">
            Game is paused, room <i>{props.store.roomId}</i>
          </Typography>
        </Grid>
        <Grid item xs={3} style={{ textAlign: "right" }}>
          <IconButton onClick={props.onClose} style={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </Grid>
        {props.store.tournament?.id && (
          <Grid item xs={12}>
            <Typography>
              In {props.store.tournament.tournamentType} tournament,{" "}
              <i>{props.store.tournament.name}</i>
            </Typography>
          </Grid>
        )}

        <Grid item xs={12}>
          <BackdropButton
            color="white"
            onClick={() => {
              props.quitGame(connectPagePath);
            }}
          >
            To waiting room
          </BackdropButton>
        </Grid>
        <Grid item xs={12}>
          <GameSettingsComponent
            gameSettings={props.store.gameSettings}
            onChange={props.updateGameSettings}
            inTestMode={props.isTestMode}
            store={props.store}
          />
        </Grid>

        <Grid item xs={4}>
          <BackdropButton
            color="white"
            onClick={() => {
              props.gameObject.restartGame();
              props.onClose();
            }}
          >
            Reset game
          </BackdropButton>
        </Grid>
        <Grid item xs={8} />
        {props.isTestMode && props.store.player && (
          <React.Fragment>
            <Grid item xs={4}>
              <VehicleSelect
                simpleSelect
                user={props.user}
                value={props.store.userSettings.vehicleSettings.vehicleType}
                onChange={(vehicleType) => {
                  const newVehicleSettings = {
                    ...props.store.userSettings.vehicleSettings,
                    vehicleType,
                  };

                  const newUserSettings = {
                    ...props.store.userSettings,
                    vehicleSettings: newVehicleSettings,
                  };
                  window.localStorage.setItem("vehicleType", vehicleType);
                  /**
                   * ONLY FOR TESTING
                   */

                  // @ts-ignore
                  props.gameObject.vehicleType = vehicleType;
                  props.gameObject.setNeedsReload(true);
                  props.store.setUserSettings(newUserSettings);
                }}
              />
            </Grid>
          </React.Fragment>
        )}
      </Grid>
    </BasicDesktopModal>
  );
};

export default GameSettingsModal;
