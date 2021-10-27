import CloseIcon from "@mui/icons-material/Close";
import { Button, Grid, IconButton, Modal } from "@mui/material";
import React from "react";
import { useHistory } from "react-router-dom";
import { IUserGameSettings, IUserSettings } from "../classes/User";
import { setDBUserSettings } from "../firebase/firebaseFunctions";
import { RaceGameScene } from "../one-monitor-game/race-game";
import { frontPagePath } from "./Routes";
import { IStore } from "./store";

interface IGameSettingsModal {
  open: boolean;
  onClose: () => void;
  gameObject: RaceGameScene;
  store: IStore;
  userId: string | undefined;
}

const GameSettingsModal = (props: IGameSettingsModal) => {
  const history = useHistory();

  const updateDBUserSettings = (newUserSettings: IUserSettings) => {
    if (props.userId) {
      setDBUserSettings(props.userId, newUserSettings);
    }
  };
  if (!props.gameObject) return null;
  return (
    <Modal open={props.open} onClose={props.onClose}>
      <div
        style={{
          transform: "translate(-50%, -50%)",
          position: "absolute",
          top: "50%",
          left: "50%",
          backgroundColor: "#eeebdf",
          border: "2px solid #000",
          padding: 10,
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={9} />
          <Grid item xs={3}>
            <IconButton onClick={props.onClose}>
              <CloseIcon />
            </IconButton>
          </Grid>
          <Grid item xs={12}>
            <h3>Game is paused</h3>
          </Grid>

          <Grid item xs={12}>
            <a href={frontPagePath}>Back to front page</a>
          </Grid>
          <Grid item xs={4}>
            <Button
              variant="contained"
              onClick={() => {
                const newUserGameSettings = {
                  ...props.store.userSettings.userGameSettings,
                  useShadows:
                    !props.store.userSettings.userGameSettings.useShadows,
                };
                const newUserSettings = {
                  ...props.store.userSettings,
                  userGameSettings: newUserGameSettings,
                };
                props.store.setUserSettings(newUserSettings);
                props.gameObject.setUserGameSettings(newUserGameSettings);
                updateDBUserSettings(newUserSettings);
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
                const newUserGameSettings = {
                  ...props.store.userSettings.userGameSettings,
                  useSound: !props.store.userSettings.userGameSettings.useSound,
                } as IUserGameSettings;
                const newUserSettings = {
                  ...props.store.userSettings,
                  userGameSettings: newUserGameSettings,
                } as IUserSettings;
                props.store.setUserSettings(newUserSettings);
                props.gameObject.setUserGameSettings(newUserGameSettings);
                updateDBUserSettings(newUserSettings);
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
        </Grid>
      </div>
    </Modal>
  );
};

export default GameSettingsModal;
