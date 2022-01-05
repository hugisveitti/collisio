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
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { useHistory } from "react-router";
import connect1 from "../../images/tournament/connect1.PNG";
import connect2 from "../../images/tournament/connect2.PNG";
import connect3 from "../../images/tournament/connect3.PNG";
import { basicColor, cardBackgroundColor } from "../../providers/theme";
import { connectPagePath } from "../Routes";

const HowToPlayTournamentComponent = () => {
  const [infoOpen, setInfoOpen] = useState(false);

  const history = useHistory();

  return (
    <Card
      style={{
        maxWidth: 400,
        margin: "auto",
        backgroundColor: cardBackgroundColor,
      }}
    >
      <CardHeader
        subheader="How to play a tournament game"
        action={
          <IconButton onClick={() => setInfoOpen(!infoOpen)}>
            {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        }
      />

      <Collapse in={infoOpen}>
        <CardContent>
          <Typography>
            Create a new room like normally. At the bottom of the waiting room
            page, you can search for tournaments you are participating in by
            clicking the button.
          </Typography>
          <Typography>
            After the tournaments have loaded, select the one you wish to
            compete in.
          </Typography>
          <Typography style={{ color: basicColor }}>
            <i>
              Here below are some images demonstrating how to play a tournament
              game.
            </i>
          </Typography>
        </CardContent>
        <CardMedia src={connect1} component="img" />
        <CardContent>
          <Typography>Press the button to find active tournaments.</Typography>
        </CardContent>
        <CardMedia src={connect2} component="img" />
        <CardContent>
          <Typography>Select the desired tournament.</Typography>
        </CardContent>
        <CardMedia src={connect3} component="img" />
        <CardContent>
          <Typography>
            On the top of the page is a small message saying this race will
            register in the tournament. If playing a local tournament, you won't
            be able to start unless the correct players are connected.
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
  );
};

export default HowToPlayTournamentComponent;
