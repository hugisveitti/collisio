import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  IconButton,
} from "@mui/material";
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
import connect1 from "../../../images/tournament/connect1.PNG";
import connect2 from "../../../images/tournament/connect2.PNG";
import connect3 from "../../../images/tournament/connect3.PNG";
import { cardBackgroundColor } from "../../../providers/theme";
import { useHistory } from "react-router";
import { connectPagePath } from "../../Routes";

interface ILocalTournamentComponent {
  tournament: LocalTournament;
  user: IUser;
}

const LocalTournamentComponent = (props: ILocalTournamentComponent) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bracket, setBracket] = useState({} as BracketTree);
  const [infoOpen, setInfoOpen] = useState(false);

  const history = useHistory();

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
          setPlayers={() => console.log("do nothing")}
        />
      </Grid>

      <Grid item xs={12}></Grid>
      <DisplayBracketsComponent bracket={bracket} />
      <Grid item xs={12}>
        <Card
          style={{
            maxWidth: 400,
            margin: "auto",
            backgroundColor: cardBackgroundColor,
          }}
        >
          <CardHeader
            subheader="How to play bracket game"
            action={
              <IconButton onClick={() => setInfoOpen(!infoOpen)}>
                {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            }
          />

          <Collapse in={infoOpen}>
            <CardContent>
              <Typography>
                Create a new room like normally. At the bottom of the waiting
                room page, you can search for tournaments you are participating
                in by clicking the button.
              </Typography>
              <Typography>
                After the tournaments have loaded, select the one you wish to
                compete in.
              </Typography>
            </CardContent>
            <CardMedia src={connect1} component="img" />
            <CardContent>
              <Typography>
                Press the button to find active tournaments.
              </Typography>
            </CardContent>
            <CardMedia src={connect2} component="img" />
            <CardContent>
              <Typography>Select the desired tournament.</Typography>
            </CardContent>
            <CardMedia src={connect3} component="img" />
            <CardContent>
              <Typography>
                On the top of the page is a small message saying this race will
                register in the tournament. If playing a local tournament, you
                won't be able to start unless the correct players are connected.
              </Typography>
            </CardContent>

            <CardContent>
              <Button
                variant="contained"
                disableElevation
                onClick={() => {
                  history.push(connectPagePath);
                }}
              >
                Create a room
              </Button>
            </CardContent>
          </Collapse>
        </Card>
      </Grid>
    </React.Fragment>
  );
};

export default LocalTournamentComponent;
