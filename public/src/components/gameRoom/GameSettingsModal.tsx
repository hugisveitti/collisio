import CloseIcon from "@mui/icons-material/Close";
import VolumeOff from "@mui/icons-material/VolumeOff";
import VolumeUp from "@mui/icons-material/VolumeUp";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import React from "react";
import { useHistory } from "react-router-dom";
import { IGameSettings } from "../../classes/localGameSettings";
import { IGameScene } from "../../game/IGameScene";
import FullscreenButton from "../inputs/FullscreenButton";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import TrackSelect from "../inputs/TrackSelect";
import VehicleSelect from "../inputs/VehicleSelect";
import BasicDesktopModal from "../modal/BasicDesktopModal";
import { IStore } from "../store";

interface IGameSettingsModal {
  open: boolean;
  onClose: () => void;
  gameObject: IGameScene | undefined;
  store: IStore;
  userId: string | undefined;
  isTestMode?: boolean;
  updateSettings: (key: keyof IGameSettings, value: any) => void;
}

const GameSettingsModal = (props: IGameSettingsModal) => {
  const history = useHistory();

  if (!props.gameObject) return null;
  return (
    <BasicDesktopModal open={props.open} onClose={props.onClose}>
      <Grid container spacing={3}>
        <Grid item xs={3} style={{ textAlign: "left" }}>
          <FullscreenButton />
        </Grid>
        <Grid item xs={6} style={{ textAlign: "center" }}>
          <Typography variant="h6">Game is paused</Typography>
        </Grid>
        <Grid item xs={3} style={{ textAlign: "right" }}>
          <IconButton onClick={props.onClose}>
            <CloseIcon />
          </IconButton>
        </Grid>

        <Grid item xs={12}>
          <ToFrontPageButton />
        </Grid>
        <Grid item xs={4} xl={2}>
          <Button
            disableElevation
            variant="contained"
            onClick={() => {
              props.updateSettings(
                "useShadows",
                !props.store.gameSettings.useShadows
              );
              const newGameSettings = {
                ...props.store.gameSettings,
                useShadows: !props.store.gameSettings.useSound,
              };
              props.store.setGameSettings(newGameSettings);
            }}
          >
            Shadows {props.store.gameSettings.useShadows ? "On" : "Off"}
          </Button>
        </Grid>
        <Grid item xs={4} xl={1}>
          <IconButton
            onClick={() => {
              props.updateSettings(
                "useSound",
                !props.store.gameSettings.useSound
              );
            }}
          >
            {props.store.gameSettings.useSound ? <VolumeUp /> : <VolumeOff />}
          </IconButton>
        </Grid>

        <Grid item xs={4} xl={9} />
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
                  const newVehicleSettings =
                    props.store.userSettings.vehicleSettings;
                  newVehicleSettings.vehicleType = vehicleType;

                  const newUserSettings = props.store.userSettings;
                  newUserSettings.vehicleSettings = newVehicleSettings;

                  /**
                   * ONLY FOR TESTING
                   */

                  // @ts-ignore
                  if (props.gameObject.vehicles.length > 0) {
                    // @ts-ignore
                    props.gameObject.vehicles[0].updateVehicleSettings(
                      newVehicleSettings
                    );
                    // @ts-ignore
                  } else if (props.gameObject.vehicle) {
                    // @ts-ignore.
                    props.gameObject.vehicle.updateVehicleSettings(
                      newVehicleSettings
                    );
                  }
                  // @ts-ignore
                  if (props.gameObject.players.length > 0) {
                    // @ts-ignore
                    props.gameObject.players[0].vehicleType = vehicleType;
                  }
                  props.gameObject.setNeedsReload(true);
                  props.store.setUserSettings(newUserSettings);
                }}
                previewVehicle={false}
              />
            </Grid>
            <Grid item xs={4}>
              <TrackSelect
                value={props.store.gameSettings.trackName}
                onChange={(trackName) => {
                  props.updateSettings("trackName", trackName);
                  const newGameSettings = {
                    ...props.store.gameSettings,
                    trackName,
                  };
                  props.store.setGameSettings(newGameSettings);
                  props.gameObject.physics.debug.disable();
                  props.gameObject.setGameSettings(newGameSettings);
                  props.gameObject.setNeedsReload(true);

                  props.gameObject.restartGame();
                }}
                excludedTracks={[]}
                gameType={props.store.gameSettings.gameType}
                showMapPreview={false}
              />
            </Grid>
          </React.Fragment>
        )}
      </Grid>
    </BasicDesktopModal>
  );
};

export default GameSettingsModal;
