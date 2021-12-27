import Grid from "@mui/material/Grid";
import React from "react";
import { LocalTournament } from "../../../classes/Tournament";

interface ILocalTournamentSettingsComponent {
  tournament: LocalTournament;
}

const LocalTournamentComponent = (props: ILocalTournamentSettingsComponent) => {
  return (
    <>
      <Grid item xs={12}>
        Number of games per series {props.tournament.numberOfGamesInSeries}
      </Grid>
      <Grid item xs={12}>
        Use group stage to determine bracket placement
        {props.tournament.useGroupStageToDetermineBracketPlacement.toString()}
      </Grid>
    </>
  );
};

export default LocalTournamentComponent;
