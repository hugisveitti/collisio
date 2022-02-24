import CloseIcon from "@mui/icons-material/Close";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import React from "react";
import { IGameSettings, IRoomSettings } from "../../classes/localGameSettings";
import { IUser } from "../../classes/User";
import { IGameScene } from "../../game/IGameScene";
import { IMultiplayerRaceGameScene } from "../../game/MultiplayerRaceGameScene";
import BackdropButton from "../button/BackdropButton";
import CollabsibleCard from "../inputs/CollapsibleCard";
import FullscreenButton from "../inputs/FullscreenButton";
import VehicleSelect from "../inputs/VehicleSelect";
import BasicDesktopModal from "../modal/BasicDesktopModal";
import { connectPagePath } from "../Routes";
import GameSettingsComponent from "../settings/GameSettingsComponent";
import RoomSettingsComponent from "../settings/RoomSettingsComponent";
import VehicleSettingsComponent from "../settings/VehicleSettingsComponent";
import { IStore } from "../store";

interface IGameSettingsModal {
  open: boolean;
  onClose: () => void;
  gameObject: IMultiplayerRaceGameScene | IGameScene | undefined;
  store: IStore;
  userId: string | undefined;
  isTestMode?: boolean;
  updateGameSettings: (gameSettings: IGameSettings) => void;
  updateRoomSettings: (roomSettings: IRoomSettings) => void;
  quitGame: (newPath: string) => void;
  user: IUser;
  restarBtnPressed: () => void;
  showVehicleSettings?: boolean;
  onlyLeaderCanSeeRoomSettings?: boolean;
  multiplayer?: boolean;
}

const GameSettingsModal = (props: IGameSettingsModal) => {
  if (!props.gameObject) return null;

  const showRoomSettings = !props.onlyLeaderCanSeeRoomSettings
    ? true
    : props.store.player?.isLeader;

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

        <Grid item xs={12} md={4}>
          <BackdropButton color="white" onClick={props.restarBtnPressed}>
            Reset game
          </BackdropButton>
        </Grid>

        <Grid item xs={12} md={4}>
          <BackdropButton
            color="white"
            onClick={() => {
              props.quitGame(connectPagePath);
            }}
          >
            To waiting room
          </BackdropButton>
        </Grid>

        {showRoomSettings && (
          <Grid item xs={12}>
            <RoomSettingsComponent
              roomSettings={props.store.roomSettings}
              onChange={props.updateRoomSettings}
              inTestMode={props.isTestMode}
              store={props.store}
              multiplayer={props.multiplayer}
            />
          </Grid>
        )}
        <Grid item xs={12}>
          <CollabsibleCard header="Game Settings">
            <GameSettingsComponent
              gameSettings={props.store.gameSettings}
              onChange={props.updateGameSettings}
              inTestMode={props.isTestMode}
              store={props.store}
              multiplayer={props.multiplayer}
            />
          </CollabsibleCard>
        </Grid>

        {props.isTestMode && props.store.player && (
          <Grid item xs={12}>
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
        )}
        {props.showVehicleSettings && (
          <Grid item xs={12}>
            <VehicleSettingsComponent
              maxWidth={"100%"}
              store={props.store}
              user={props.user}
            />
          </Grid>
        )}
      </Grid>
    </BasicDesktopModal>
  );
};

export default GameSettingsModal;
