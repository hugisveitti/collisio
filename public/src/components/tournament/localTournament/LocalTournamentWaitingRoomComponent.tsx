import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  createBracketTree,
  ITournamentUser,
  LocalTournament,
  validateCreateTournament,
  validateStartTournament,
} from "../../../classes/Tournament";
import { IUser } from "../../../classes/User";
import { setTournament } from "../../../firebase/firestoreTournamentFunctions";
import { arrayToDict } from "../../../utils/utilFunctions";
import EditTournamentComponent from "../EditTournamentComponent";
import TournamentPlayersComponent from "../TournamentPlayersComponent";
import TournamentSettingsComponent from "../TournamentSettingsComponent";

interface ILocalTournamentWaitingRoomComponent {
  tournament: LocalTournament;
  user: IUser;
}

const LocalTournamentWaitingRoomComponent = (
  props: ILocalTournamentWaitingRoomComponent
) => {
  const [players, setPlayers] = useState([] as ITournamentUser[]);
  const [editing, setEditing] = useState(false);
  const [editTournament, setEditTournament] = useState(props.tournament);

  const updateTournament = (key: keyof LocalTournament, value: any) => {
    const newTournament = { ...editTournament };
    // @ts-ignore
    newTournament[key] = value;
    setEditTournament(newTournament as LocalTournament);
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
                const tournament: LocalTournament = {
                  ...props.tournament,
                  players: arrayToDict(players, "uid"),
                  playersIds: players.map((p) => p.uid),
                };

                const val = validateStartTournament(tournament);
                if (val.status === "error") {
                  toast.error(val.message);
                } else {
                  const root = createBracketTree(players.length);
                  root.populateTree(players);
                  const startTournament: LocalTournament = {
                    ...tournament,
                    hasStarted: true,
                    flattenBracket: root.flatten(),
                  };

                  setTournament(startTournament);
                }
              }}
            >
              Start tournament
            </Button>
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
