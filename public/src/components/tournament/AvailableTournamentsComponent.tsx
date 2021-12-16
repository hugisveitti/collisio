import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItemText from "@mui/material/ListItemText";
import Grid from "@mui/material/Grid";
import ListItemButton from "@mui/material/ListItemButton";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";
import { Unsubscribe } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { IUser } from "../../classes/User";
import { getAvailableTournamentsListener } from "../../firebase/firestoreTournamentFunctions";
import { getTournamentPagePath } from "../Routes";
import { CircularProgress } from "@mui/material";

interface IAvailableTournamentsComponent {
  user: IUser;
}

const AvailableTournamentsComponent = (
  props: IAvailableTournamentsComponent
) => {
  const [tournaments, setTournements] = useState(undefined);

  const history = useHistory();

  useEffect(() => {
    if (!props.user?.uid) return;
    let unsub: Unsubscribe;
    getAvailableTournamentsListener(props.user.uid, (_tournaments) => {
      console.log("tournaments", _tournaments);
      setTournements(_tournaments);
    }).then((_unsub) => {
      unsub = _unsub;
    });

    return () => {
      if (unsub) {
        unsub();
      }
    };
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
        <Typography>No tournaments available</Typography>
      </Grid>
    );
  }

  return (
    <React.Fragment>
      <Grid item xs={12}>
        <Typography>List of available tournaments</Typography>
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

export default AvailableTournamentsComponent;
