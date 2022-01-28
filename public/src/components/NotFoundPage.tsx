import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React from "react";
import AppContainer from "../containers/AppContainer";
import BackdropContainer from "./backdrop/BackdropContainer";
import ToFrontPageButton from "./inputs/ToFrontPageButton";

interface INotFoundPage {}

const NotFoundPage = (props: INotFoundPage) => {
  return (
    <BackdropContainer noMusic backgroundContainer>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography>Page not found</Typography>
        </Grid>
        <Grid item xs={12}>
          <ToFrontPageButton color="white" />
        </Grid>
      </Grid>
    </BackdropContainer>
  );
};

export default NotFoundPage;
