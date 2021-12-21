import Grid from "@mui/material/Grid";
import React from "react";
import { GlobalTournament } from "../../classes/Tournament";
import { getDateString } from "../../utils/utilFunctions";

interface IGlobalTournamentSettingsComponent {
  tournament: GlobalTournament;
}

const GlobalTournamentComponent = (
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
        Runs per player {props.tournament.runsPerPlayer}
      </Grid>
    </>
  );
};

export default GlobalTournamentComponent;
