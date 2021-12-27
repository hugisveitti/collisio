import Grid from "@mui/material/Grid";
import React from "react";
import { LocalTournament, GlobalTournament } from "../../classes/Tournament";
import { getDateString } from "../../utils/utilFunctions";
import GlobalTournamentSettingsComponent from "./globalTournament/GlobalTournamentSettingsComponent";
import LocalTournamentSettingsComponent from "./localTournament/LocalTournamentSettingsComponent";

interface ITournamentSettingsComponent<V> {
  tournament: V;
}

const TournamentSettingsComponent: <
  T extends LocalTournament | GlobalTournament
>(
  p: ITournamentSettingsComponent<T>
) => React.ReactElement<ITournamentSettingsComponent<T>> = (props) => {
  const renderSpecificTournament = () => {
    if (props.tournament.tournamentType === "local") {
      return (
        <LocalTournamentSettingsComponent
          tournament={props.tournament as LocalTournament}
        />
      );
    }
    return (
      <GlobalTournamentSettingsComponent
        tournament={props.tournament as GlobalTournament}
      />
    );
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        Has started: {props.tournament.hasStarted.toString()}
      </Grid>

      <Grid item xs={12}>
        Is finished: {props.tournament.isFinished.toString()}
      </Grid>
      <Grid item xs={12}>
        Leader: {props.tournament.leaderName}
      </Grid>
      <Grid item xs={12}>
        Type: {props.tournament.tournamentType}
      </Grid>
      <Grid item xs={12}>
        Number of laps: {props.tournament.numberOfLaps}
      </Grid>
      <Grid item xs={12}>
        Track {props.tournament.trackName}
      </Grid>
      <Grid item xs={12}>
        Vehicle type: {props.tournament.vehicleType}
      </Grid>
      <Grid item xs={12}>
        Creation date: {getDateString(props.tournament.creationDate)}
      </Grid>
      {renderSpecificTournament()}
    </Grid>
  );
};

export default TournamentSettingsComponent;
