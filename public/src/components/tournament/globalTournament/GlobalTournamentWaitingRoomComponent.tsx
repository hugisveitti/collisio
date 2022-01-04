import { Button, Divider } from "@mui/material";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  ITournamentUser,
  GlobalTournament,
  validateStartTournament,
  validateCreateTournament,
} from "../../../classes/Tournament";
import { IUser } from "../../../classes/User";
import {
  setTournament,
  deleteTournament,
} from "../../../firebase/firestoreTournamentFunctions";
import { arrayToDict } from "../../../utils/utilFunctions";
import TournamentPlayersComponent from "../TournamentPlayersComponent";
import DeleteButton from "../../inputs/DeleteButton";
import EditTournamentComponent from "../EditTournamentComponent";
import TournamentSettingsComponent from "../TournamentSettingsComponent";

interface IGlobalTournamentWaitingRoomComponent {
  tournament: GlobalTournament;
  user: IUser;
}

const GlobalTournamentWaitingRoomComponent = (
  props: IGlobalTournamentWaitingRoomComponent
) => {
  const [players, setPlayers] = useState([] as ITournamentUser[]);

  const [editing, setEditing] = useState(false);
  const [editTournament, setEditTournament] = useState(props.tournament);

  const updateTournament = (key: keyof GlobalTournament, value: any) => {
    const newTournament = { ...editTournament };
    // @ts-ignore
    newTournament[key] = value;
    setEditTournament(newTournament as GlobalTournament);
  };

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h4">{props.tournament.name} </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6">Tournament waiting room</Typography>
      </Grid>
      <Grid xs={12} item>
        <Typography>Global tournament</Typography>
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
      {editing ? (
        <EditTournamentComponent
          user={props.user}
          tournament={editTournament}
          updateTournament={updateTournament}
        />
      ) : (
        <TournamentSettingsComponent tournament={props.tournament} />
      )}

      {props.tournament.leaderId === props.user?.uid && (
        <>
          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={() => {
                if (editing) {
                  const res = validateCreateTournament(editTournament);
                  console.log("res", res);
                  if (res.status === "error") {
                    toast.error(res.message);
                  } else {
                    setTournament(editTournament);
                    setEditing(!editing);
                  }
                } else {
                  setEditing(!editing);
                  setEditTournament(props.tournament);
                }
              }}
              color="info"
            >
              {!editing ? "Edit tournament" : "Submit edit"}
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              disabled={editing}
              onClick={() => {
                const tournament: GlobalTournament = {
                  ...props.tournament,
                  players: arrayToDict(players, "uid"),
                  playersIds: players.map((p) => p.uid),
                };

                const val = validateStartTournament(tournament);
                if (val.status === "error") {
                  toast.error(val.message);
                } else {
                  const startTournament: GlobalTournament = {
                    ...tournament,
                    hasStarted: true,
                  };
                  setTournament(startTournament);
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

export default GlobalTournamentWaitingRoomComponent;
