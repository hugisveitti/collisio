import HelpIcon from "@mui/icons-material/Help";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React from "react";
import { Link } from "react-router-dom";
import AppContainer from "../containers/AppContainer";
import logo from "../images/collisio-logo.png";
import "../styles/main.css";
import { highscorePagePath, howToPlayPagePath } from "./Routes";
import { IStore } from "./store";

interface FrontPageProps {
  store: IStore;
}

const FrontPage = (props: FrontPageProps) => {
  // useEffect(() => {
  //   const id = "test";
  //   getTournamentGhost(id)
  //     .then((val) => {
  //       console.log("val");
  //     })
  //     .catch((err) => {
  //       console.log("err", err);
  //     });

  //   // uploadTournamentGhost(id, ["1 1 1 1 2 2 2", "2 2 2 2 3 2 1"]);
  // }, []);

  return (
    <AppContainer>
      <Grid container spacing={5}>
        <Grid item xs={12}>
          <Typography variant="h3" component="div" gutterBottom>
            Welcome to
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <img src={logo} style={{ width: 400, maxWidth: "80%" }} alt="" />
        </Grid>
        <Grid item xs={12}>
          <Typography color="gray">
            Create a room, you and upto 3 friends connect to that room with your
            mobile phones. You can also play singleplayer and compete againt
            highscores.
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Typography>
            A car game where your phone is the controller. No installations, no
            fuss, just a desktop browser and a smartphone browser.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Divider variant="middle" />
        </Grid>
        <Grid item xs={false} sm={1} lg={4} xl={4} />
        <Grid item xs={12} sm={5} lg={2} xl={2}>
          <Link style={{ textDecoration: "none" }} to={howToPlayPagePath}>
            <Button
              disableElevation
              variant="contained"
              size="small"
              startIcon={<HelpIcon />}
            >
              How to play
            </Button>
          </Link>
        </Grid>
        <Grid item xs={12} sm={5} lg={2} xl={2}>
          <Link to={highscorePagePath} style={{ textDecoration: "none" }}>
            <Button
              disableElevation
              variant="contained"
              startIcon={<SportsScoreIcon />}
              size="small"
            >
              Highscores
            </Button>
          </Link>
        </Grid>
        <Grid item xs={false} sm={1} lg={4} xl={4} />
      </Grid>
    </AppContainer>
  );
};

export default FrontPage;
