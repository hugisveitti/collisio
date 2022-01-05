import Grid from "@mui/material/Grid";
import React from "react";
import { getTrackNameFromType } from "../../classes/Game";
import { LocalTournament, GlobalTournament } from "../../classes/Tournament";
import { cardBackgroundColor } from "../../providers/theme";
import { getDateString } from "../../utils/utilFunctions";
import { getVehicleNameFromType } from "../../vehicles/VehicleConfigs";
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
    <Grid
      container
      spacing={3}
      style={{
        backgroundColor: cardBackgroundColor,
        width: 500,
        maxWidth: "90%",
        margin: "auto",
        paddingBottom: 15,
      }}
    >
      <Grid item xs={12}>
        {props.tournament.hasStarted
          ? "The tournament has started."
          : "The tournament hasn't started."}
      </Grid>
      <Grid item xs={12}>
        {props.tournament.isFinished
          ? "The tournament is finished"
          : "The tournament isn't finished."}
      </Grid>
      <Grid item xs={12}>
        The leader of the tournament is {props.tournament.leaderName}
      </Grid>
      <Grid item xs={12}>
        This is a {props.tournament.tournamentType} tournament.
      </Grid>
      <Grid item xs={12}>
        Number of laps per game is {props.tournament.numberOfLaps}.
      </Grid>
      <Grid item xs={12}>
        Track {getTrackNameFromType(props.tournament.trackName)}
      </Grid>
      <Grid item xs={12}>
        {props.tournament.vehicleType
          ? `Only using ${getVehicleNameFromType(props.tournament.vehicleType)}`
          : "All vehicles allowed."}
      </Grid>
      <Grid item xs={12}>
        Creation date: {getDateString(props.tournament.creationDate)}
      </Grid>
      {renderSpecificTournament()}
    </Grid>
  );
};

export default TournamentSettingsComponent;
