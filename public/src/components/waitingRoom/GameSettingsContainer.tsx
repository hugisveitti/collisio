import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Grid from "@mui/material/Grid";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  IGameSettings,
  setAllLocalGameSettings,
} from "../../classes/localGameSettings";
import {
  BracketTree,
  ITournament,
  LocalTournament,
  Tournament,
} from "../../classes/Tournament";
import {
  getActiveTournaments,
  getTournamentWithId,
} from "../../firebase/firestoreTournamentFunctions";
import { UserContext } from "../../providers/UserProvider";
import {
  mdts_game_settings_changed,
  stmd_game_settings_changed,
} from "../../shared-backend/shared-stuff";
import TournamentSelect from "../inputs/TournamentSelect";
import { IStore } from "../store";
import GameSettingsComponent from "./GameSettingsComponent";
import TagRulesComponent from "./TagRulesComponent";

interface IGameSettingsContainer {
  store: IStore;
}

const GameSettingsContainer = (props: IGameSettingsContainer) => {
  const user = useContext(UserContext);
  console.log("store", props.store);
  const [activeTournaments, setActiveTournamnets] = useState(
    [] as ITournament[]
  );

  useEffect(() => {
    props.store.socket.on(stmd_game_settings_changed, (data) => {
      props.store.setGameSettings(data.gameSettings);
      setAllLocalGameSettings(data.gameSettings);
    });
    return () => {
      props.store.socket.off(stmd_game_settings_changed);
    };
  }, []);

  const handleGetBracketNode = (tournament: Tournament) => {
    if (tournament.tournamentType === "local") {
      const activeBracketNode = BracketTree.FindActiveBracketNode(
        (tournament as LocalTournament).flattenBracket,
        props.store.players[0]?.id
      );
      console.log("active bracket node", activeBracketNode);
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
      console.log("tournament changed");
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

  return (
    <Grid item xs={12}>
      <Card
        variant="outlined"
        style={{
          backgroundColor: "inherit",
          width: "100%",
        }}
      >
        <CardHeader
          title="Game Settings"
          subheader="The leader can also change game settings in game"
        />
        <CardContent>
          <GameSettingsComponent
            gameSettings={props.store.gameSettings}
            onChange={(newGameSettings) => {
              props.store.setGameSettings(newGameSettings);
              props.store.socket.emit(mdts_game_settings_changed, {
                gameSettings: newGameSettings,
              });
            }}
          />
        </CardContent>
        <CardContent>
          {props.store.gameSettings.gameType === "tag" && <TagRulesComponent />}
        </CardContent>
        <CardActions>
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
                toast.error(
                  "Players must be logged in to search for tournaments."
                );
                return;
              }
              setActiveTournamnets(undefined);
              getActiveTournaments(props.store.players[0].id).then((_t) => {
                console.log("_t active tour", _t);
                setActiveTournamnets(_t);
                if (_t?.length > 0) {
                  console.log("setting tournament");
                  const newGameSettings: IGameSettings = {
                    ...props.store.gameSettings,
                    tournamentId: _t[0].id,
                  };
                  props.store.socket.emit(mdts_game_settings_changed, {
                    gameSettings: newGameSettings,
                  });
                  props.store.setGameSettings(newGameSettings);
                  props.store.setTournament(_t[0]);
                  handleGetBracketNode(_t[0]);
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
            }}
          />
        </CardActions>
      </Card>
    </Grid>
  );
};

export default GameSettingsContainer;
