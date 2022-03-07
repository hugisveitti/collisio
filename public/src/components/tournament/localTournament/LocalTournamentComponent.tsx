import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { BracketTree, LocalTournament } from "../../../classes/Tournament";
import { IUser } from "../../../classes/User";
import { dictToArray } from "../../../utils/utilFunctions";
import TournamentPlayersList from "../TournamentPlayersList";
import TournamentSettingsComponent from "../TournamentSettingsComponent";
import DisplayBracketsComponent from "./DisplayBracketsComponent";

interface ILocalTournamentComponent {
  tournament: LocalTournament;
  user: IUser;
}

const LocalTournamentComponent = (props: ILocalTournamentComponent) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bracket, setBracket] = useState({} as BracketTree);

  useEffect(() => {
    setBracket(
      BracketTree.Deflatten(
        props.tournament.flattenBracket,
        props.tournament.playersIds.length
      )
    );
  }, []);

  return (
    <React.Fragment>
      <Grid item xs={12}>
        <Typography variant="h4">{props.tournament.name} </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6">Tournament room</Typography>
      </Grid>
      <Grid item xs={12}>
        <Button
          onClick={() => setSettingsOpen(!settingsOpen)}
          variant="contained"
          disableElevation
        >
          See settings
        </Button>
      </Grid>
      <Grid item xs={12}>
        <Collapse in={settingsOpen}>
          <TournamentSettingsComponent tournament={props.tournament} />
        </Collapse>
      </Grid>

      <Grid item xs={12}>
        <TournamentPlayersList
          user={props.user}
          tournament={props.tournament}
          editingRanking={false}
          players={dictToArray(props.tournament.players)}
          setPlayers={() => {}}
        />
      </Grid>

      <Grid item xs={12}></Grid>
      <DisplayBracketsComponent bracket={bracket} />
    </React.Fragment>
  );
};

export default LocalTournamentComponent;
