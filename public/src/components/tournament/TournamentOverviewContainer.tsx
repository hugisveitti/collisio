import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React, { useContext } from "react";
import { useHistory, useParams } from "react-router";
import { UserContext } from "../../providers/UserProvider";
import BackdropContainer from "../backdrop/BackdropContainer";
import BackdropButton from "../button/BackdropButton";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import { createTournamentPagePath } from "../Routes";
import { IStore } from "../store";
import ActiveTournamentsComponent from "./ActiveTournamentsComponent";
import AvailableTournamentsComponent from "./AvailableTournamentsComponent";
import PreviousTournamentsComponent from "./PreviousTournamentsComponent";
import TournamentContainer from "./TournamentContainer";

interface TournamentPageParamType {
  tournamentId: string;
}

interface ITournamentOverviewContainer {
  store: IStore;
}

const TournamentOverviewContainer = (props: ITournamentOverviewContainer) => {
  const params = useParams<TournamentPageParamType>();
  const { tournamentId } = params;
  const history = useHistory();

  const user = useContext(UserContext);

  if (tournamentId) {
    return (
      <TournamentContainer
        tournamentId={tournamentId}
        user={user}
        store={props.store}
      />
    );
  }

  return (
    <BackdropContainer backgroundContainer>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <ToFrontPageButton color="white" />
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography component="div" variant="h4">
            Tournaments
          </Typography>
        </Grid>
        <Grid item xs={false} md={3}></Grid>
        <Grid item xs={12}>
          <Typography>Here you can join or start a tournament.</Typography>
        </Grid>
        {/* <Grid item xs={12} xl={2}>
          <ToFrontPageButton color="white" />
        </Grid> */}
        <Grid item xs={12} xl={12}>
          <BackdropButton
            color="white"
            center
            startIcon={<EmojiEventsIcon />}
            onClick={() => {
              history.push(createTournamentPagePath);
            }}
          >
            Create a tournament
          </BackdropButton>
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
    </BackdropContainer>
  );
};

export default TournamentOverviewContainer;
