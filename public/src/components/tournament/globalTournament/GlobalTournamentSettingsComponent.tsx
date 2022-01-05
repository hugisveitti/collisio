import Grid from "@mui/material/Grid";
import React from "react";
import { GlobalTournament } from "../../../classes/Tournament";
import { getDateString } from "../../../utils/utilFunctions";

interface IGlobalTournamentSettingsComponent {
  tournament: GlobalTournament;
}

const GlobalTournamentSettingsComponent = (
  props: IGlobalTournamentSettingsComponent
) => {
  return (
    <>
      <Grid item xs={12}>
        Start of tournament {getDateString(props.tournament.tournamentStart)}
      </Grid>
      <Grid item xs={12}>
        End of tournament {getDateString(props.tournament.tournamentEnd)}
      </Grid>
      <Grid item xs={12}>
        {props.tournament.runsPerPlayer ? (
          <>Runs per player {props.tournament.runsPerPlayer}</>
        ) : (
          <>No limit on runs per player.</>
        )}
      </Grid>
    </>
  );
};

export default GlobalTournamentSettingsComponent;
