import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React from "react";
import collisioPic from "../images/collisio-fb.png";
import logo from "../images/logo.jpg";
import hugi from "../images/hugi.jpg";
import BackdropContainer from "./backdrop/BackdropContainer";
import BackdropButton from "./button/BackdropButton";
import ToFrontPageButton from "./inputs/ToFrontPageButton";
import DonateButton from "./monitary/DonateButton";
import { buyCoinsPagePath } from "./Routes";

interface IAboutPageComponent {}

const AboutPageComponent = (props: IAboutPageComponent) => {
  return (
    <BackdropContainer backgroundContainer>
      <Grid container spacing={3}>
        <Grid item xs={12} lg={2}>
          <ToFrontPageButton color="white" />
        </Grid>
        <Grid item xs={12} lg={10}>
          <Typography variant="h3">About Collisio</Typography>
        </Grid>
        <Grid item xs={12}>
          <img src={logo} style={{ width: 500, maxWidth: "90%" }} />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1">
            Collisio's development started in quarantine after I contracted the
            Corona virus at the end of summer 2021. The game development kept me
            busy and away from the fact that it was illegal for me to be
            outside. It also kept me away from working on my master thesis
            defence, since I was hooked on the development.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1">
            After graduating I decided to work on Collisio instead of finding a
            job, as the development was too fun.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2">
            Currently I am the only person working on Collisio.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <img
            src={hugi}
            style={{
              width: 300,
              maxWidth: "50%",
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography>
            <i>Me, Hugi :)</i>
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography>
            Help support this project by buying in game coins or donating.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <BackdropButton link={buyCoinsPagePath}>Buy Coins</BackdropButton>
        </Grid>
        <Grid item xs={12}>
          <DonateButton />
        </Grid>
      </Grid>
    </BackdropContainer>
  );
};

export default AboutPageComponent;
