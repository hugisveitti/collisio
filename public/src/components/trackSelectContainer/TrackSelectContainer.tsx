import React from "react";
import { nonActiveTrackNames } from "../../classes/Game";
import { GameType, TrackName } from "../../shared-backend/shared-stuff";
import BackdropContainer from "../backdrop/BackdropContainer";
import TrackSelect from "./TrackSelect";
import { IStore } from "../store";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import Grid from "@mui/material/Grid";
import MyRadio from "../radio/MyRadio";
import { IRoomSettings } from "../../classes/localGameSettings";

interface ITrackSelectContainer {
  store: IStore;
}

const TrackSelectContainer = (props: ITrackSelectContainer) => {
  return (
    <BackdropContainer backgroundContainer>
      <Grid container spacing={1}>
        <Grid item xs={6}>
          <ToFrontPageButton />
        </Grid>
        <Grid item xs={6}>
          <MyRadio<GameType>
            label="Type of game"
            checked={props.store.roomSettings.gameType}
            onChange={(newType) => {
              const newRoomSettings: IRoomSettings = {
                ...props.store.roomSettings,
                gameType: newType,
              };
              props.store.setRoomSettings(newRoomSettings);
            }}
            options={[
              { label: "Race", value: "race" },
              { label: "Tag", value: "tag" },
            ]}
          />
        </Grid>
        <Grid item xs={12}>
          <TrackSelect
            gameType={props.store.roomSettings.gameType}
            excludedTracks={nonActiveTrackNames}
            value={props.store.roomSettings.trackName}
            onChange={(trackName: TrackName) => {
              const roomSettings: IRoomSettings = {
                ...props.store.roomSettings,
                trackName,
              };
              props.store.setRoomSettings(roomSettings);
            }}
            store={props.store}
          />
        </Grid>
      </Grid>
    </BackdropContainer>
  );
};

export default TrackSelectContainer;
