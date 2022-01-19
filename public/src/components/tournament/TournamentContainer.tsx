import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import QRCode from "qrcode";
import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import {
  GlobalTournament,
  ITournament,
  LocalTournament,
} from "../../classes/Tournament";
import { IUser } from "../../classes/User";
import {
  createGetTournametListener,
  deleteTournament,
} from "../../firebase/firestoreTournamentFunctions";
import { UserContext } from "../../providers/UserProvider";
import { getDeviceType } from "../../utils/settings";
import BackdropContainer from "../backdrop/BackdropContainer";
import BackdropButton from "../button/BackdropButton";
import CopyTextButton from "../inputs/CopyTextButton";
import DeleteButton from "../inputs/DeleteButton";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import { connectPagePath, tournamentPagePath } from "../Routes";
import { IStore } from "../store";
import GlobalTournamentComponent from "./globalTournament/GlobalTournamentComponent";
import GlobalTournamentWaitingRoomComponent from "./globalTournament/GlobalTournamentWaitingRoomComponent";
import HowToPlayTournamentComponent from "./HowToPlayTournamentComponent";
import LocalTournamentComponent from "./localTournament/LocalTournamentComponent";
import LocalTournamentWaitingRoomComponent from "./localTournament/LocalTournamentWaitingRoomComponent";

interface ITournamentContainer {
  tournamentId: string;
  user: IUser;
  store: IStore;
}

const TournamentContainer = (props: ITournamentContainer) => {
  const [tournamentQrCode, setTournamentQrCode] = useState("");

  const onMobile = getDeviceType() === "mobile";
  const [tournament, setTournament] = useState(
    null as null | undefined | ITournament
  );

  const history = useHistory();
  const user = useContext(UserContext);

  useEffect(() => {
    if (!onMobile) {
      QRCode.toDataURL(window.location.href)
        .then((url) => {
          setTournamentQrCode(url);
        })
        .catch((err) => {
          console.log("error generating qr code", err);
        });
    }

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
    <BackdropContainer backgroundContainer>
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
            <Grid item xs={12} lg={9}>
              <CopyTextButton
                infoText={`Link to tournament: ${window.location.href}`}
                copyText={window.location.href}
              />
            </Grid>
            {tournamentQrCode && (
              <Grid item xs={12} lg={3}>
                <img src={tournamentQrCode} alt="" />
              </Grid>
            )}
            {tournament.hasStarted && (
              <Grid item xs={12}>
                <BackdropButton
                  center
                  onClick={() => {
                    if (onMobile) {
                      toast.error("You can only create games on desktop.");
                    } else {
                      props.store.setTournament(tournament);
                      // const newGameSettings = {
                      //   ...props.store.gameSettings,
                      //   torunamentId: tournament.id,
                      // };
                      // props.store.setGameSettings(newGameSettings);
                      props.store.setPreviousPage(tournamentPagePath);
                      history.push(connectPagePath);
                    }
                  }}
                >
                  Create tournament game
                </BackdropButton>
              </Grid>
            )}
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
    </BackdropContainer>
  );
};

export default TournamentContainer;
