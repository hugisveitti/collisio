import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React from "react";

const AvailableTournamentsComponent = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography>List of available tournaments</Typography>
      </Grid>
    </Grid>
  );
};

export default AvailableTournamentsComponent;
