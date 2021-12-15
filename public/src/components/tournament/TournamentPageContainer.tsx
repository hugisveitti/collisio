import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React from "react";
import { useHistory } from "react-router";
import AppContainer from "../../containers/AppContainer";
import { createTournamentPagePath } from "../Routes";
import AvailableTournamentsComponent from "./AvailableTournamentsComponent";

interface ITournamentPageContainer {}

const TournamentPageContainer = (props: ITournamentPageContainer) => {
  const history = useHistory();
  return (
    <AppContainer>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography component="div" variant="h4">
            Tournaments
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography>Here you can join or start a tournament.</Typography>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            startIcon={<EmojiEventsIcon />}
            disableElevation
            onClick={() => {
              history.push(createTournamentPagePath);
            }}
          >
            Create a tournament
          </Button>
        </Grid>
        <Grid item xs={12}>
          <AvailableTournamentsComponent />
        </Grid>
      </Grid>
    </AppContainer>
  );
};

export default TournamentPageContainer;
