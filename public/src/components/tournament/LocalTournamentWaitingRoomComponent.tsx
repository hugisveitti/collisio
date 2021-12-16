import { Button, Divider } from "@mui/material";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  ITournamentUser,
  LocalTournament,
  validateStartTournament,
} from "../../classes/Tournament";
import { IUser } from "../../classes/User";
import {
  addTournament,
  deleteTournament,
} from "../../firebase/firestoreTournamentFunctions";
import { arrayToDict } from "../../utils/utilFunctions";
import TournamentPlayersComponent from "./TournamentPlayersComponent";
import DeleteButton from "../inputs/DeleteButton";

interface ILocalTournamentWaitingRoomComponent {
  tournament: LocalTournament;
  user: IUser;
}

const LocalTournamentWaitingRoomComponent = (
  props: ILocalTournamentWaitingRoomComponent
) => {
  const [players, setPlayers] = useState([] as ITournamentUser[]);

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h4">{props.tournament.name} </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6">Tournament waiting room</Typography>
      </Grid>
      <Grid xs={12} item>
        <Typography>Local tournament</Typography>
      </Grid>

      <TournamentPlayersComponent
        tournament={props.tournament}
        user={props.user}
        players={players}
        setPlayers={setPlayers}
      />

      <Grid item xs={12}>
        <Divider variant="middle" />
      </Grid>

      {props.tournament.leaderId === props.user?.uid && (
        <>
          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={() => {
                console.log("edit not impl");
              }}
              color="info"
            >
              Edit tournament
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={() => {
                const tournament: LocalTournament = {
                  ...props.tournament,
                  players: arrayToDict(players, "uid"),
                };

                const val = validateStartTournament(tournament);
                if (val.status === "error") {
                  toast.error(val.message);
                } else {
                  console.log("not impl");
                  const startTournament: LocalTournament = {
                    ...tournament,
                    hasStarted: true,
                  };
                  addTournament(startTournament);
                }
              }}
            >
              Start tournament
            </Button>
          </Grid>
          <Grid item xs={12}>
            <DeleteButton
              onDelete={() => {
                deleteTournament(props.tournament.id)
                  .then(() => {
                    toast.success("Tournament successfully deleted");
                  })
                  .catch(() => {
                    toast.error("Error deleting tournament");
                  });
              }}
            />
          </Grid>
        </>
      )}

      {props.tournament.leaderId !== props.user?.uid && (
        <Grid item xs={12}>
          <Typography>Waiting for leader to start tournament</Typography>
        </Grid>
      )}
    </>
  );
};

export default LocalTournamentWaitingRoomComponent;
