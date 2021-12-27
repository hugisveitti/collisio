import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React from "react";
import { LocalTournament } from "../../../classes/Tournament";
import { IUser } from "../../../classes/User";
import { dictToArray } from "../../../utils/utilFunctions";
import TournamentPlayersList from "../TournamentPlayersList";

interface ILocalTournamentComponent {
  tournament: LocalTournament;
  user: IUser;
}

const LocalTournamentComponent = (props: ILocalTournamentComponent) => {
  return (
    <React.Fragment>
      <Grid item xs={12}>
        <Typography variant="h4">{props.tournament.name} </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6">Tournament room</Typography>
      </Grid>
      <Grid item xs={12}>
        <TournamentPlayersList
          user={props.user}
          tournament={props.tournament}
          editingRanking={false}
          players={dictToArray(props.tournament.players)}
          setPlayers={() => console.log("do nothing")}
        />
      </Grid>
    </React.Fragment>
  );
};

export default LocalTournamentComponent;
