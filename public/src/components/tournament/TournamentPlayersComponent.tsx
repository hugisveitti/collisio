import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ITournament, ITournamentUser } from "../../classes/Tournament";
import { IUser } from "../../classes/User";
import {
  joinTournament,
  leaveTournament,
} from "../../firebase/firestoreTournamentFunctions";
import TournamentPlayersList from "./TournamentPlayersList";

interface ITournamentPlayersComponent {
  tournament: ITournament;
  user: IUser;
  setPlayers: React.Dispatch<React.SetStateAction<ITournamentUser[]>>;
  players: ITournamentUser[];
  tournamentStarted?: boolean;
}

const TournamentPlayersComponent = (props: ITournamentPlayersComponent) => {
  const [playerInTournament, setPlayerInTournament] = useState(false);
  const [joinButtonLoading, setJoinButtonLoading] = useState(false);
  const [isEditingRank, setIsEditingRank] = useState(false);

  const handlePlayerClickedJoinLeave = (_playerInTournament: boolean) => {
    setJoinButtonLoading(true);
    if (_playerInTournament) {
      leaveTournament(props.user, props.tournament.id)
        .then(() => {
          setJoinButtonLoading(false);
          setPlayerInTournament(false);
        })
        .catch(() => {
          toast.error("Error leaving tournament");
        });
    } else {
      joinTournament(props.user, props.tournament.id)
        .then(() => {
          setJoinButtonLoading(false);
          setPlayerInTournament(true);
        })
        .catch(() => {
          toast.error("Error joining tournament");
        });
    }
  };

  useEffect(() => {
    let playerIn = false;
    for (let i = 0; i < props.players.length; i++) {
      if (props.players[i].uid === props.user?.uid) {
        setPlayerInTournament(true);
        playerIn = true;
      }
    }

    if (!playerIn) {
      handlePlayerClickedJoinLeave(false);
    }
  }, [props.players]);

  if (!props.tournament) return null;

  return (
    <React.Fragment>
      {!props.tournamentStarted && (
        <Grid item xs={12}>
          {joinButtonLoading ? (
            <CircularProgress />
          ) : (
            <Button
              variant="contained"
              disableElevation
              onClick={() => {
                if (!props.user) {
                  toast.error("Only logged in players can join tournaments");
                  return;
                }
                handlePlayerClickedJoinLeave(playerInTournament);
              }}
            >
              {playerInTournament ? "Leave tournament" : "Join tournament"}
            </Button>
          )}
        </Grid>
      )}
      <Grid item xs={12}>
        <Typography variant="h5">Players in tournament</Typography>
      </Grid>

      <Grid item xs={12}>
        <TournamentPlayersList
          user={props.user}
          tournament={props.tournament}
          editingRanking={isEditingRank}
          players={props.players}
          setPlayers={props.setPlayers}
        />
      </Grid>
      {!props.tournamentStarted &&
        props.tournament.tournamentType === "local" &&
        props.tournament.leaderId === props.user?.uid && (
          <Grid item xs={12}>
            <Button
              variant="contained"
              disableElevation
              onClick={() => {
                setIsEditingRank(!isEditingRank);
              }}
            >
              {isEditingRank ? "Update ranks" : "Edit ranks"}
            </Button>
          </Grid>
        )}
    </React.Fragment>
  );
};

export default TournamentPlayersComponent;
