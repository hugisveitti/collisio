import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import React from "react";
import AppContainer from "../../containers/AppContainer";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import Button from "@mui/material/Button";
import { toast } from "react-toastify";

interface ITournamentPageContainer {}

const TournamentPageContainer = (props: ITournamentPageContainer) => {
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
              toast("Tournaments not available");
            }}
          >
            Create a tournament
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Typography>List of available tournaments</Typography>
        </Grid>
      </Grid>
    </AppContainer>
  );
};

export default TournamentPageContainer;
