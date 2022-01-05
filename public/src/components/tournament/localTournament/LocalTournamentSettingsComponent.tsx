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
        {props.tournament.numberOfGamesInSeries} games per series.
      </Grid>
      {/* <Grid item xs={12}>
        {props.tournament.useGroupStageToDetermineBracketPlacement
          ? "Using group stage to determine bracket placement."
          : "Not using a group stage to determine bracket placement."}
      </Grid> */}
    </>
  );
};

export default LocalTournamentComponent;
