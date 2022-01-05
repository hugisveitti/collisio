import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React, { useContext } from "react";
import { useHistory, useParams } from "react-router";
import AppContainer from "../../containers/AppContainer";
import { UserContext } from "../../providers/UserProvider";
import { createTournamentPagePath } from "../Routes";
import ActiveTournamentsComponent from "./ActiveTournamentsComponent";
import AvailableTournamentsComponent from "./AvailableTournamentsComponent";
import PreviousTournamentsComponent from "./PreviousTournamentsComponent";
import TournamentContainer from "./TournamentContainer";

interface TournamentPageParamType {
  tournamentId: string;
}

interface ITournamentOverviewContainer {}

const TournamentOverviewContainer = (props: ITournamentOverviewContainer) => {
  const params = useParams<TournamentPageParamType>();
  const { tournamentId } = params;
  const history = useHistory();

  const user = useContext(UserContext);

  if (tournamentId) {
    return <TournamentContainer tournamentId={tournamentId} user={user} />;
  }

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
          <Divider style={{ margin: "auto", width: 100 }} />
        </Grid>

        <AvailableTournamentsComponent user={user} />

        <Grid item xs={12}>
          <Divider style={{ margin: "auto", width: 100 }} />
        </Grid>

        <ActiveTournamentsComponent user={user} />

        <Grid item xs={12}>
          <Divider style={{ margin: "auto", width: 100 }} />
        </Grid>

        <PreviousTournamentsComponent user={user} />
      </Grid>
    </AppContainer>
  );
};

export default TournamentOverviewContainer;
