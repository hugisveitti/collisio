import { CircularProgress, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import React, { useEffect, useState } from "react";
import {
  GlobalTournament,
  ITournament,
  LocalTournament,
} from "../../classes/Tournament";
import { IUser } from "../../classes/User";
import AppContainer from "../../containers/AppContainer";
import { createGetTournametListener } from "../../firebase/firestoreTournamentFunctions";
import CopyTextButton from "../inputs/CopyTextButton";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import GlobalTournamentComponent from "./GlobalTournamentComponent";
import GlobalTournamentWaitingRoomComponent from "./GlobalTournamentWaitingRoomComponent";
import LocalTournamentComponent from "./LocalTournamentComponent";
import LocalTournamentWaitingRoomComponent from "./LocalTournamentWaitingRoomComponent";

interface ITournamentContainer {
  tournamentId: string;
  user: IUser;
}

const TournamentContainer = (props: ITournamentContainer) => {
  const [tournament, setTournament] = useState(
    null as null | undefined | ITournament
  );

  useEffect(() => {
    const unsub = createGetTournametListener(
      props.tournamentId,
      (_t: ITournament | undefined) => {
        console.log("_T", _t);
        setTournament(_t);
      }
    );
    return () => {
      unsub();
    };
  }, []);

  const renderTournament = () => {
    if (tournament === undefined) {
      return (
        <>
          <Grid item xs={12}>
            <Typography>No tournament with given id found.</Typography>
          </Grid>
          <Grid item xs={12}>
            <ToFrontPageButton />
          </Grid>
        </>
      );
    }
    if (tournament.tournamentType === "local") {
      if (tournament.hasStarted) {
        return (
          <LocalTournamentComponent
            user={props.user}
            tournament={tournament as LocalTournament}
          />
        );
      }
      return (
        <LocalTournamentWaitingRoomComponent
          tournament={tournament as LocalTournament}
          user={props.user}
        />
      );
    }

    if (tournament.hasStarted) {
      return (
        <GlobalTournamentComponent
          user={props.user}
          tournament={tournament as GlobalTournament}
        />
      );
    }

    return (
      <GlobalTournamentWaitingRoomComponent
        tournament={tournament as GlobalTournament}
        user={props.user}
      />
    );
  };

  return (
    <AppContainer>
      <Grid container spacing={3}>
        {tournament === null ? (
          <>
            <Grid item xs={12}>
              <CircularProgress />
            </Grid>
            <Grid item xs={12}>
              <Typography>Loading tournament...</Typography>
            </Grid>
          </>
        ) : (
          <>
            <Grid item xs={12}>
              <CopyTextButton
                infoText={`Link to tournament: ${window.location.href}`}
                copyText={window.location.href}
              />
            </Grid>
            {renderTournament()}
          </>
        )}
      </Grid>
    </AppContainer>
  );
};

export default TournamentContainer;
