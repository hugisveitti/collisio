import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { IRoomSettings } from "../../../classes/localGameSettings";
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
import { getSocket } from "../../../utils/connectSocket";
import BackdropButton from "../../button/BackdropButton";
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

  const socket = getSocket();

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
    if (props.store.roomSettings.tournamentId !== props.store.tournament?.id) {
      if (props.store.roomSettings.tournamentId) {
        getTournamentWithId(props.store.roomSettings.tournamentId).then(
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
  }, [props.store.roomSettings]);

  const handleChangeSettings = (tournament: ITournament) => {
    const newRoomSettings: IRoomSettings = {
      ...props.store.roomSettings,
      tournamentId: tournament?.id,
    };
    if (!tournament || tournament?.id === "undefined") {
      delete newRoomSettings.tournamentId;
      props.store.setTournament(undefined);
      props.store.setActiveBracketNode(undefined);
    } else {
      newRoomSettings.numberOfLaps = tournament.numberOfLaps;
      newRoomSettings.trackName = tournament.trackName;
      // compete in other than race ?
      newRoomSettings.gameType = "race";

      props.store.setTournament(tournament);
      handleGetBracketNode(tournament);
    }
    console.log("new room settings", newRoomSettings);

    props.store.setRoomSettings(newRoomSettings);
    socket.emit(mdts_game_settings_changed, {
      roomSettings: newRoomSettings,
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
      <BackdropButton
        style={{ marginRight: 10 }}
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
      </BackdropButton>

      <TournamentSelect
        tournaments={activeTournaments}
        selectedId={props.store.roomSettings.tournamentId}
        selectedName={props.store.tournament?.name}
        onChange={(tournament) => {
          handleChangeSettings(tournament);
        }}
      />
    </div>
  );
};

export default FindActiveTournamentComponent;
