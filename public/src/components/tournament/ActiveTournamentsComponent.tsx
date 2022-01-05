import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import { IUser } from "../../classes/User";
import { getActiveTournaments } from "../../firebase/firestoreTournamentFunctions";
import TournamentsTable from "./TournamentsTable";

interface IActiveTournamentsComponent {
  user: IUser;
}

const ActiveTournamentsComponent = (props: IActiveTournamentsComponent) => {
  const [tournaments, setTournements] = useState(undefined);

  const history = useHistory();

  useEffect(() => {
    if (!props.user?.uid) return;

    getActiveTournaments(props.user.uid)
      .then((_tournaments) => {
        console.log("active tournaments", _tournaments);
        setTournements(_tournaments);
      })
      .catch(() => {
        toast.error("Error getting active tournaments");
        setTournements([]);
      });
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

  if (tournaments.length === 0) {
    return (
      <Grid item xs={12}>
        <Typography>No active tournaments</Typography>
      </Grid>
    );
  }

  return (
    <React.Fragment>
      <Grid item xs={12}>
        <Typography>
          List of active tournaments, those that have already started.
        </Typography>
      </Grid>
      <Grid item xs={false} lg={3} />
      <Grid item xs={12} lg={6}>
        <TournamentsTable tournaments={tournaments} />
      </Grid>

      <Grid item xs={false} lg={3} />
    </React.Fragment>
  );
};

export default ActiveTournamentsComponent;
