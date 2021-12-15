import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import React from "react";
import Divider from "@mui/material/Divider";

const CreateGlobalTournamentComponent = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography>
          Global tournaments can be for players that are not physically
          together. Each player tries to get their best time on a give
          track/number of laps combination. There can be set a limit for the
          number of runs each player is allowed. A predetermined window of time
          is allowed for this tournament. The player with the quickest time when
          the tournament finishes is the winner.
          {/** This could be used to determine placement for the local tournament bracets */}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Divider variant="middle" />
      </Grid>
      <Grid item xs={12}>
        <Typography>Create Global tournament</Typography>
      </Grid>
      <Grid item xs={12}>
        <TextField label="Name" />
      </Grid>
    </Grid>
  );
};

export default CreateGlobalTournamentComponent;
