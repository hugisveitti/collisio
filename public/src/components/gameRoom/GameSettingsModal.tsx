import CloseIcon from "@mui/icons-material/Close";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import React from "react";
import { IGameSettings } from "../../classes/localGameSettings";
import { IGameScene } from "../../game/IGameScene";
import FullscreenButton from "../inputs/FullscreenButton";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import VehicleSelect from "../inputs/VehicleSelect";
import BasicDesktopModal from "../modal/BasicDesktopModal";
import { IStore } from "../store";
import GameSettingsComponent from "../waitingRoom/GameSettingsComponent";

interface IGameSettingsModal {
  open: boolean;
  onClose: () => void;
  gameObject: IGameScene | undefined;
  store: IStore;
  userId: string | undefined;
  isTestMode?: boolean;
  updateGameSettings: (gameSettings: IGameSettings) => void;
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
          <IconButton onClick={props.onClose}>
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
          <ToFrontPageButton />
        </Grid>
        <Grid item xs={12}>
          <GameSettingsComponent
            gameSettings={props.store.gameSettings}
            onChange={props.updateGameSettings}
            inTestMode={props.isTestMode}
          />
        </Grid>

        <Grid item xs={4}>
          <Button
            disableElevation
            variant="contained"
            onClick={() => {
              props.gameObject.restartGame();
              props.onClose();
            }}
          >
            Reset game
          </Button>
        </Grid>
        <Grid item xs={8} />
        {props.isTestMode && props.store.player && (
          <React.Fragment>
            <Grid item xs={4}>
              <VehicleSelect
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
                previewVehicle={false}
              />
            </Grid>
          </React.Fragment>
        )}
      </Grid>
    </BasicDesktopModal>
  );
};

export default GameSettingsModal;
