import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React from "react";
import AppContainer from "../containers/AppContainer";
import ToFrontPageButton from "./inputs/ToFrontPageButton";

interface INotFoundPage {}

const NotFoundPage = (props: INotFoundPage) => {
  return (
    <AppContainer>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography>Page not found</Typography>
        </Grid>
        <Grid item xs={12}>
          <ToFrontPageButton />
        </Grid>
      </Grid>
    </AppContainer>
  );
};

export default NotFoundPage;
