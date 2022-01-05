import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  GlobalTournament,
  ITournament,
  LocalTournament,
} from "../../classes/Tournament";
import { IUser } from "../../classes/User";
import AppContainer from "../../containers/AppContainer";
import {
  createGetTournametListener,
  deleteTournament,
} from "../../firebase/firestoreTournamentFunctions";
import { UserContext } from "../../providers/UserProvider";
import CopyTextButton from "../inputs/CopyTextButton";
import DeleteButton from "../inputs/DeleteButton";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import GlobalTournamentComponent from "./globalTournament/GlobalTournamentComponent";
import GlobalTournamentWaitingRoomComponent from "./globalTournament/GlobalTournamentWaitingRoomComponent";
import LocalTournamentComponent from "./localTournament/LocalTournamentComponent";
import LocalTournamentWaitingRoomComponent from "./localTournament/LocalTournamentWaitingRoomComponent";
import HowToPlayTournamentComponent from "./HowToPlayTournamentComponent";

interface ITournamentContainer {
  tournamentId: string;
  user: IUser;
}

const TournamentContainer = (props: ITournamentContainer) => {
  const [tournament, setTournament] = useState(
    null as null | undefined | ITournament
  );

  const user = useContext(UserContext);

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
        <Grid item xs={12}>
          <HowToPlayTournamentComponent />
        </Grid>
        {tournament?.id && tournament.leaderId === user?.uid && (
          <Grid item xs={12}>
            <DeleteButton
              onDelete={() => {
                deleteTournament(tournament.id)
                  .then(() => {
                    toast.success("Tournament successfully deleted");
                  })
                  .catch(() => {
                    toast.error("Error deleting tournament");
                  });
              }}
            />
          </Grid>
        )}
      </Grid>
    </AppContainer>
  );
};

export default TournamentContainer;
