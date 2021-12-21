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
import { ITournament } from "../../classes/Tournament";
import { getActiveTournaments } from "../../firebase/firestoreTournamentFunctions";
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
              if (user?.uid) {
                setActiveTournamnets(undefined);
                getActiveTournaments(user.uid).then((_t) => {
                  console.log("_t active tour", _t);
                  setActiveTournamnets(_t);
                });
              } else {
                toast.error("Only logged in users can look for tounaments");
              }
            }}
          >
            Find active tournaments
          </Button>

          <TournamentSelect
            tournaments={activeTournaments}
            selectedId={props.store.gameSettings.tournamentId}
            onChange={(tournament) => {
              const newGameSettings: IGameSettings = {
                ...props.store.gameSettings,
                tournamentId: tournament?.id,
              };
              if (!tournament || tournament?.id === "undefined") {
                delete newGameSettings.tournamentId;
              } else {
                newGameSettings.numberOfLaps = tournament.numberOfLaps;
                newGameSettings.trackName = tournament.trackName;
                // compete in other than race ?
                newGameSettings.gameType = "race";
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
