import { Button } from "@mui/material";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { IGameSettings } from "../../../classes/localGameSettings";
import {
  BracketTree,
  ITournament,
  LocalTournament,
  Tournament,
} from "../../../classes/Tournament";
import {
  getActiveTournaments,
  getTournamentWithId,
} from "../../../firebase/firestoreTournamentFunctions";
import { yellow3 } from "../../../providers/theme";
import { mdts_game_settings_changed } from "../../../shared-backend/shared-stuff";
import TournamentSelect from "../../inputs/TournamentSelect";
import { IStore } from "../../store";

interface IFindActiveTournamentComponent {
  store: IStore;
  standOut?: boolean;
}

const FindActiveTournamentComponent = (
  props: IFindActiveTournamentComponent
) => {
  const [activeTournaments, setActiveTournamnets] = useState(
    [] as ITournament[]
  );

  const handleGetBracketNode = (tournament: Tournament) => {
    if (tournament.tournamentType === "local") {
      const activeBracketNode = BracketTree.FindActiveBracketNode(
        (tournament as LocalTournament).flattenBracket,
        props.store.players[0]?.id
      );
      if (!activeBracketNode) {
        toast.error(
          `No active bracket found for ${props.store.players[0].playerName}`
        );
        props.store.setTournament(undefined);
      }
      props.store.setActiveBracketNode(activeBracketNode);
    } else {
      props.store.setActiveBracketNode(undefined);
    }
  };

  useEffect(() => {
    if (props.store.gameSettings.tournamentId !== props.store.tournament?.id) {
      if (props.store.gameSettings.tournamentId) {
        getTournamentWithId(props.store.gameSettings.tournamentId).then(
          (tournament) => {
            console.log("new tournament gotten", tournament);
            props.store.setTournament(tournament);
            if (props.store.players.length > 0) {
              handleGetBracketNode(tournament);
            }
          }
        );
      } else {
        props.store.setTournament(undefined);
        props.store.setActiveBracketNode(undefined);
      }
    }
  }, [props.store.gameSettings]);

  const handleChangeSettings = (tournament: ITournament) => {
    const newGameSettings: IGameSettings = {
      ...props.store.gameSettings,
      tournamentId: tournament?.id,
    };
    if (!tournament || tournament?.id === "undefined") {
      delete newGameSettings.tournamentId;
      props.store.setTournament(undefined);
      props.store.setActiveBracketNode(undefined);
    } else {
      newGameSettings.numberOfLaps = tournament.numberOfLaps;
      newGameSettings.trackName = tournament.trackName;
      // compete in other than race ?
      newGameSettings.gameType = "race";

      props.store.setTournament(tournament);
      handleGetBracketNode(tournament);
    }
    console.log("new game settings", newGameSettings);

    props.store.setGameSettings(newGameSettings);
    props.store.socket.emit(mdts_game_settings_changed, {
      gameSettings: newGameSettings,
    });
  };

  const styles: React.CSSProperties = props.standOut
    ? {
        backgroundColor: yellow3,
        maxWidth: 500,
        margin: "auto",
        padding: 15,
      }
    : {};

  return (
    <div style={styles}>
      <Button
        style={{ marginRight: 10 }}
        variant="contained"
        disableElevation
        onClick={() => {
          if (props.store.players.length === 0) {
            toast.error(
              "No players in waiting room. Players are needed to search for tournaments."
            );
            return;
          }
          if (!props.store.players[0].isAuthenticated) {
            toast.error("Players must be logged in to search for tournaments.");
            return;
          }
          setActiveTournamnets(undefined);
          getActiveTournaments(props.store.players[0].id).then((_t) => {
            console.log("_t active tour", _t);
            setActiveTournamnets(_t);
            if (_t?.length > 0) {
              handleChangeSettings(_t[0]);
            }
          });
        }}
      >
        Find active tournaments
      </Button>

      <TournamentSelect
        tournaments={activeTournaments}
        selectedId={props.store.gameSettings.tournamentId}
        selectedName={props.store.tournament?.name}
        onChange={(tournament) => {
          handleChangeSettings(tournament);
        }}
      />
    </div>
  );
};

export default FindActiveTournamentComponent;
