import React from "react";
import { nonActiveTrackNames } from "../../classes/Game";
import { GameType, TrackName } from "../../shared-backend/shared-stuff";
import BackdropContainer from "../backdrop/BackdropContainer";
import TrackSelect from "./TrackSelect";
import { IStore } from "../store";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import Grid from "@mui/material/Grid";
import MyRadio from "../radio/MyRadio";

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
            checked={props.store.gameSettings.gameType}
            onChange={(newType) => {
              const newGameSettings = {
                ...props.store.gameSettings,
                gameType: newType,
              };
              props.store.setGameSettings(newGameSettings);
            }}
            options={[
              { label: "Race", value: "race" },
              { label: "Tag", value: "tag" },
            ]}
          />
        </Grid>
        <Grid item xs={12}>
          <TrackSelect
            gameType={props.store.gameSettings.gameType}
            excludedTracks={nonActiveTrackNames}
            value={props.store.gameSettings.trackName}
            onChange={(trackName: TrackName) => {
              const gameSettings = {
                ...props.store.gameSettings,
                trackName,
              };
              props.store.setGameSettings(gameSettings);
            }}
            store={props.store}
          />
        </Grid>
      </Grid>
    </BackdropContainer>
  );
};

export default TrackSelectContainer;
