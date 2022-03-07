import Refresh from "@mui/icons-material/Refresh";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import { IUser } from "../../classes/User";
import { getAvailableTournaments } from "../../firebase/firestoreTournamentFunctions";
import TournamentsTable from "./TournamentsTable";
import BackdropButton from "../button/BackdropButton";

interface IAvailableTournamentsComponent {
  user: IUser;
}

const AvailableTournamentsComponent = (
  props: IAvailableTournamentsComponent
) => {
  const [tournaments, setTournements] = useState(undefined);
  const [gettingTournaments, setGettingTournaments] = useState(true);
  const history = useHistory();

  const handleGetAllAvailableTournaments = () => {
    setGettingTournaments(true);
    getAvailableTournaments(props.user.uid)
      .then((_tournaments) => {
        setTournements(_tournaments);
        setGettingTournaments(false);
      })
      .catch(() => {
        setTournements(undefined);
        setGettingTournaments(false);
        toast.error("Error getting tournaments.s");
      });
  };

  useEffect(() => {
    if (!props.user?.uid) return;
    handleGetAllAvailableTournaments();
  }, [props.user]);

  if (!props.user) {
    return (
      <Grid item xs={12}>
        <Typography>Tournaments are only for logged in users.</Typography>
      </Grid>
    );
  }

  if (tournaments === undefined) {
    return (
      <React.Fragment>
        <Grid item xs={12}>
          <CircularProgress />
        </Grid>
        <Grid item xs={12}>
          <Typography>Loading..</Typography>
        </Grid>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <Grid item xs={12}>
        <BackdropButton
          onClick={() => handleGetAllAvailableTournaments()}
          startIcon={<Refresh />}
          disabled={gettingTournaments}
          center
        >
          Get available tournaments
        </BackdropButton>
      </Grid>
      {gettingTournaments ? (
        <Grid item xs={12}>
          <CircularProgress />
        </Grid>
      ) : (
        <>
          {tournaments.length === 0 ? (
            <Grid item xs={12}>
              <Typography>No tournaments available</Typography>
            </Grid>
          ) : (
            <>
              <Grid item xs={12}>
                <Typography>List of available tournaments</Typography>
              </Grid>
              <Grid item xs={false} lg={3} />
              <Grid item xs={12} lg={6}>
                <TournamentsTable tournaments={tournaments} />
              </Grid>

              <Grid item xs={false} lg={3} />
            </>
          )}
        </>
      )}
    </React.Fragment>
  );
};

export default AvailableTournamentsComponent;
