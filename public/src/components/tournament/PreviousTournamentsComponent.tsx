import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import { IUser } from "../../classes/User";
import { getPreviousTournaments } from "../../firebase/firestoreTournamentFunctions";
import BackdropButton from "../button/BackdropButton";
import TournamentsTable from "./TournamentsTable";

interface IPreviousTournamentsComponent {
  user: IUser;
}

const PreviousTournamentsComponent = (props: IPreviousTournamentsComponent) => {
  const [tournaments, setTournements] = useState(undefined);
  const [showTournaments, setShowTournaments] = useState(false);

  const history = useHistory();

  const handleGetTournaments = () => {
    if (!props.user?.uid) {
      toast.error("Only logged in users can have tournaments.");
      return;
    }
    setShowTournaments(true);
    getPreviousTournaments(props.user.uid)
      .then((_tournaments) => {
        console.log("previous tournaments", _tournaments);
        setTournements(_tournaments);
      })
      .catch(() => {
        toast.error("Error getting previous tournaments");
        setTournements([]);
      });
  };

  useEffect(() => {}, [props.user]);

  const renderTournamentComponent = () => {
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

    if (tournaments.length === 0) {
      return (
        <Grid item xs={12}>
          <Typography>No completed tournaments</Typography>
        </Grid>
      );
    }

    return (
      <React.Fragment>
        <Grid item xs={12}>
          <Typography>List of previous tournaments</Typography>
        </Grid>
        <Grid item xs={false} lg={3} />
        <Grid item xs={12} lg={6}>
          <TournamentsTable tournaments={tournaments} />
        </Grid>

        <Grid item xs={false} lg={3} />
      </React.Fragment>
    );
  };

  return (
    <>
      {showTournaments ? (
        renderTournamentComponent()
      ) : (
        <Grid item xs={12}>
          <BackdropButton center onClick={handleGetTournaments}>
            Get Completed tournaments
          </BackdropButton>
        </Grid>
      )}
    </>
  );
};

export default PreviousTournamentsComponent;
