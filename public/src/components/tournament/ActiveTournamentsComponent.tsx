import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { IUser } from "../../classes/User";
import { getActiveTournaments } from "../../firebase/firestoreTournamentFunctions";
import { getTournamentPagePath } from "../Routes";

interface IActiveTournamentsComponent {
  user: IUser;
}

const ActiveTournamentsComponent = (props: IActiveTournamentsComponent) => {
  const [tournaments, setTournements] = useState(undefined);

  const history = useHistory();

  useEffect(() => {
    if (!props.user?.uid) return;

    getActiveTournaments(props.user.uid, (_tournaments) => {
      console.log("tournaments", _tournaments);
      setTournements(_tournaments);
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
        <Typography>List of active tournaments</Typography>
      </Grid>
      <Grid item xs={12}>
        <List>
          {tournaments.map((tournament) => {
            return (
              <ListItem key={tournament.id}>
                <ListItemText
                  style={{ textAlign: "center" }}
                  primary={tournament.leaderName}
                />
                <ListItemText
                  style={{ textAlign: "center" }}
                  primary={tournament.name}
                />
                <ListItemButton
                  style={{ textAlign: "center" }}
                  onClick={() => {
                    history.push(getTournamentPagePath(tournament.id));
                  }}
                >
                  <Button variant="outlined">View</Button>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Grid>
    </React.Fragment>
  );
};

export default ActiveTournamentsComponent;
