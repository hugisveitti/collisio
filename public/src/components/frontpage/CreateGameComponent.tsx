import { Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import React from "react";
import { getDeviceType } from "../../utils/settings";
import BackdropButton from "../button/BackdropButton";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import {
  connectPagePath,
  mobileOnlyWaitingRoomPath,
  multiplayerConnectPagePath,
} from "../Routes";

interface ICreateGameComponent {
  onBack: () => void;
}

const CreateGameComponent = (props: ICreateGameComponent) => {
  const onMobile = getDeviceType() === "mobile";
  const btnStyles: React.CSSProperties = !onMobile
    ? { textAlign: "center", height: 100, lineHeight: "100px" }
    : {};

  const containerStyles: React.CSSProperties = !onMobile
    ? {
        width: "90%",
        margin: "auto",
        marginTop: 100,
      }
    : {
        width: "90%",
      };

  return (
    <Grid container spacing={3} style={containerStyles}>
      <Grid item xs={12}>
        <BackdropButton onClick={props.onBack}>&lt; Back</BackdropButton>
      </Grid>
      <Grid item xs={12}></Grid>
      <Grid item xs={12} sm={6} md={6}>
        <BackdropButton link={connectPagePath} width="100%" style={btnStyles}>
          {onMobile ? "Join Splitscreen" : "Play Splitscreen/Singleplayer"}
        </BackdropButton>
      </Grid>
      <Grid item xs={12} sm={6} md={6}>
        <BackdropButton
          link={multiplayerConnectPagePath}
          width="100%"
          style={btnStyles}
        >
          {onMobile ? "Join Multiplayer" : "Play Multiplayer"}
        </BackdropButton>
      </Grid>
      {!onMobile && (
        <React.Fragment>
          <Grid item xs={12} sm={6} md={6}>
            <Typography>
              Splitscreen/Singleplayer uses the mobile phone as a remote
              controller, where you steer like you would steer a car. You can
              play agains a bot.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={6}>
            <Typography>
              The multiplayer allows you to connect and play with friends
              online, using a keyboard or optinally the mobile controller. You
              can also play single player with the keyboard and against a bot.
              Currently you can only earn XP and coins through playing with the
              mobile controller.
            </Typography>
          </Grid>
        </React.Fragment>
      )}
      <Grid item xs={12} sm={6} md={6}>
        {onMobile && (
          <BackdropButton
            link={mobileOnlyWaitingRoomPath}
            width="100%"
            style={btnStyles}
          >
            Play mobile version
          </BackdropButton>
        )}
      </Grid>
    </Grid>
  );
};

export default CreateGameComponent;
