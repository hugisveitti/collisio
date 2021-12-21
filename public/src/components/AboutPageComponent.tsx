import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import React from "react";
import AppContainer from "../containers/AppContainer";
import hugi from "../images/hugi.jpg";
import collisioPic from "../images/collisio-fb.png";
import { useHistory } from "react-router";
import { buyPremiumPagePath } from "./Routes";
import DonateButton from "./monitary/DonateButton";

interface IAboutPageComponent {}

const AboutPageComponent = (props: IAboutPageComponent) => {
  const history = useHistory();

  return (
    <AppContainer>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h3">About Collisio</Typography>
        </Grid>
        <Grid item xs={12}>
          <img src={collisioPic} style={{ width: "100%", maxWidth: 500 }} />
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
            Help support this project by buying a premium account or donating.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            onClick={() => history.push(buyPremiumPagePath)}
          >
            Go Premium
          </Button>
        </Grid>
        <Grid item xs={12}>
          <DonateButton />
        </Grid>
      </Grid>
    </AppContainer>
  );
};

export default AboutPageComponent;
