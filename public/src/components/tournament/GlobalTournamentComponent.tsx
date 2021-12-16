import { Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import React from "react";
import { GlobalTournament } from "../../classes/Tournament";

interface IGlobalTournamentComponent {
  tournament: GlobalTournament;
}

const GlobalTournamentComponent = (props: IGlobalTournamentComponent) => {
  return (
    <>
      <Grid xs={12} item>
        <Typography>Global tournament, {props.tournament.name}</Typography>
      </Grid>
    </>
  );
};

export default GlobalTournamentComponent;
