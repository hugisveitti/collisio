import Grid from "@mui/material/Grid";
import React from "react";
import AppContainer from "../../containers/AppContainer";
import TrophyRoomComponent from "./TrophyRoomComponent";

interface ITrophyRoomContainer {}

const TrophyRoomContainer = (props: ITrophyRoomContainer) => {
  return (
    <AppContainer>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TrophyRoomComponent />
        </Grid>
      </Grid>
    </AppContainer>
  );
};

export default TrophyRoomContainer;
