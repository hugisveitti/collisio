import CloseIcon from "@mui/icons-material/Close";
import { Button, Grid, IconButton, Typography } from "@mui/material";
import React from "react";
import { useHistory } from "react-router-dom";
import {
  IGameSettings,
  setLocalGameSetting,
} from "../../classes/localGameSettings";
import { IUserSettings } from "../../classes/User";
import { setDBUserSettings } from "../../firebase/firebaseFunctions";
import { IGameScene } from "../../game/IGameScene";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import TrackSelect from "../inputs/TrackSelect";
import VehicleSelect from "../inputs/VehicleSelect";
import BasicDesktopModal from "../modal/BasicDesktopModal";
import { IStore } from "../store";

interface IGameSettingsModal {
  open: boolean;
  onClose: () => void;
  gameObject: IGameScene;
  store: IStore;
  userId: string | undefined;
  isTestMode?: boolean;
}

const GameSettingsModal = (props: IGameSettingsModal) => {
  const history = useHistory();

  const updateSettings = (key: keyof IGameSettings, value: any) => {
    const newGameSettings = props.store.gameSettings;

    // @ts-ignore
    newGameSettings[key] = value;
    setLocalGameSetting(key, value);

    props.gameObject.setGameSettings(newGameSettings);
  };

  if (!props.gameObject) return null;
  return (
    <BasicDesktopModal open={props.open} onClose={props.onClose}>
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <Typography variant="h6">Game is paused</Typography>
        </Grid>
        <Grid item xs={6} style={{ textAlign: "right" }}>
          <IconButton onClick={props.onClose}>
            <CloseIcon />
          </IconButton>
        </Grid>

        <Grid item xs={12}>
          <ToFrontPageButton />
        </Grid>
        <Grid item xs={4}>
          <Button
            disableElevation
            variant="contained"
            onClick={() => {
              updateSettings(
                "useShadows",
                !props.store.gameSettings.useShadows
              );
            }}
          >
            Shadows {props.store.gameSettings.useShadows ? "On" : "Off"}
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button
            disableElevation
            variant="contained"
            onClick={() => {
              updateSettings("useSound", !props.store.gameSettings.useSound);
            }}
          >
            Sound {props.store.gameSettings.useSound ? "On" : "Off"}
          </Button>
        </Grid>

        <Grid item xs={4} />
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
                value={props.store.player.vehicleType}
                onChange={(vehicleType) => {
                  const newVehicleSettings =
                    props.store.userSettings.vehicleSettings;
                  newVehicleSettings.vehicleType = vehicleType;

                  const newUserSettings = props.store.userSettings;
                  newUserSettings.vehicleSettings = newVehicleSettings;

                  props.store.setUserSettings(newUserSettings);
                  props.gameObject.changeVehicle(0, vehicleType);
                }}
                previewVehicle={false}
              />
            </Grid>
            <Grid item xs={4}>
              <TrackSelect
                value={props.store.gameSettings.trackName}
                onChange={(trackName) => {
                  updateSettings("trackName", trackName);
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
