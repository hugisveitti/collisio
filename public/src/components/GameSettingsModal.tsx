import CloseIcon from "@mui/icons-material/Close";
import {
  Button,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Modal,
  Select,
} from "@mui/material";
import React from "react";
import { useHistory } from "react-router-dom";
import { allTrackTypes, IPreGameSettings } from "../classes/Game";
import { IUserGameSettings, IUserSettings } from "../classes/User";
import { setDBUserSettings } from "../firebase/firebaseFunctions";
import { IGameScene } from "../one-monitor-game/IGameScene";
import {
  IPlayerInfo,
  TrackType,
  VehicleType,
} from "../shared-backend/shared-stuff";
import { allVehicleTypes } from "../vehicles/VehicleConfigs";
import { frontPagePath } from "./Routes";
import { IStore } from "./store";

interface IPreGameSettingsModal {
  open: boolean;
  onClose: () => void;
  gameObject: IGameScene;
  store: IStore;
  userId: string | undefined;
  isTestMode?: boolean;
}

const GameSettingsModal = (props: IPreGameSettingsModal) => {
  const history = useHistory();

  const updateDBUserSettings = (newUserSettings: IUserSettings) => {
    if (props.userId) {
      setDBUserSettings(props.userId, newUserSettings);
    }
  };

  const updateSettings = (key: keyof IUserGameSettings, value: any) => {
    const newUserGameSettings = props.store.userSettings.userGameSettings;

    newUserGameSettings[key] = value;

    const newUserSettings = {
      ...props.store.userSettings,
      userGameSettings: newUserGameSettings,
    };

    props.store.setUserSettings(newUserSettings);
    props.gameObject.setUserGameSettings(newUserGameSettings);
    updateDBUserSettings(newUserSettings);
  };

  if (!props.gameObject) return null;
  return (
    <Modal open={props.open} onClose={props.onClose} style={{ border: 0 }}>
      <div
        style={{
          transform: "translate(-50%, -50%)",
          position: "absolute",
          top: "50%",
          left: "50%",
          backgroundColor: "#eeebdf",
          border: "2px solid #000",
          padding: 10,
          outline: 0,
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <h3>Game is paused</h3>
          </Grid>
          <Grid item xs={6} style={{ textAlign: "right" }}>
            <IconButton onClick={props.onClose}>
              <CloseIcon />
            </IconButton>
          </Grid>

          <Grid item xs={12}>
            <a href={frontPagePath}>Back to front page</a>
          </Grid>
          <Grid item xs={4}>
            <Button
              variant="contained"
              onClick={() => {
                updateSettings(
                  "useShadows",
                  !props.store.userSettings.userGameSettings.useShadows
                );
              }}
            >
              Shadows{" "}
              {props.store.userSettings.userGameSettings.useShadows
                ? "On"
                : "Off"}
            </Button>
          </Grid>
          <Grid item xs={4}>
            <Button
              variant="contained"
              onClick={() => {
                updateSettings(
                  "useSound",
                  !props.store.userSettings.userGameSettings.useSound
                );
              }}
            >
              Sound{" "}
              {props.store.userSettings.userGameSettings.useSound
                ? "On"
                : "Off"}
            </Button>
          </Grid>
          {/* <Grid item xs={3}>
            <Button
              variant="contained"
              onClick={() => {
                history.push(waitingRoomPath + "/" + props.gameObject.roomId);
                // need to alert the mobile devices, clear the canvas, stop the game
              }}
            >
              Back to waiting room
            </Button>
          </Grid> */}
          <Grid item xs={4} />
          <Grid item xs={4}>
            <Button
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
                <FormControl fullWidth>
                  <InputLabel id="vehicle-select">Vehicle</InputLabel>
                  <Select
                    style={{
                      backgroundColor: "white",
                    }}
                    label="Vehicle selection"
                    name="vehicle"
                    onChange={(e) => {
                      const newPayerInfo = {
                        ...props.store.player,
                        vehicleType: e.target.value,
                      } as IPlayerInfo;
                      props.store.setPlayer(newPayerInfo);

                      if (props.gameObject.changeVehicle) {
                        props.gameObject.changeVehicle(
                          e.target.value as VehicleType
                        );
                      }
                    }}
                    value={props.store.player.vehicleType}
                  >
                    {allVehicleTypes.map((v) => (
                      <MenuItem key={v.name} value={v.type}>
                        {v.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <FormControl fullWidth>
                  <InputLabel id="track-select">Track</InputLabel>
                  <Select
                    style={{
                      backgroundColor: "white",
                    }}
                    label="Track selection"
                    name="track"
                    onChange={(e) => {
                      const newPreGameSettings: IPreGameSettings = {
                        ...props.store.userSettings.preGameSettings,
                        trackName: e.target.value as TrackType,
                      };

                      const newUserSettings: IUserSettings = {
                        ...props.store.userSettings,
                        preGameSettings: newPreGameSettings,
                      };
                      props.store.setUserSettings(newUserSettings);

                      if (props.gameObject.changeTrack) {
                        props.gameObject.changeTrack(
                          e.target.value as TrackType
                        );
                      }
                    }}
                    value={props.store.userSettings.preGameSettings.trackName}
                  >
                    {allTrackTypes.map((t) => (
                      <MenuItem key={t.name} value={t.type}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </React.Fragment>
          )}
        </Grid>
      </div>
    </Modal>
  );
};

export default GameSettingsModal;
