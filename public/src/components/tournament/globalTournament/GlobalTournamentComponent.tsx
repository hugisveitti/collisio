import { Button, Collapse, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import React, { useState } from "react";
import { GlobalTournament } from "../../../classes/Tournament";
import { IUser } from "../../../classes/User";
import GlobalTournamentScoreboard from "./GlobalTournamentScoreboard";
import TournamentSettingsComponent from "../TournamentSettingsComponent";

interface IGlobalTournamentComponent {
  tournament: GlobalTournament;
  user: IUser;
}

const GlobalTournamentComponent = (props: IGlobalTournamentComponent) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [raceData, setRaceData] = useState([]);

  return (
    <>
      <Grid xs={12} item>
        <Typography variant="h3">{props.tournament.name}</Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6">Global tournament room</Typography>
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

      {/* <Grid item xs={12}>
        <TournamentPlayersList
          user={props.user}
          tournament={props.tournament}
          editingRanking={false}
          players={dictToArray(props.tournament.players)}
          setPlayers={() => console.log("do nothing")}
        />
      </Grid> */}

      <Grid item xs={12}>
        <GlobalTournamentScoreboard tournamentId={props.tournament.id} />
      </Grid>
    </>
  );
};

export default GlobalTournamentComponent;
