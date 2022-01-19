import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React from "react";
import settingsImage from "../../images/mobile-settings.PNG";
import { getDeviceType } from "../../utils/settings";
import BackdropContainer from "../backdrop/BackdropContainer";
import BackdropButton from "../button/BackdropButton";
import FullscreenButton from "../inputs/FullscreenButton";
import ToFrontPageButton from "../inputs/ToFrontPageButton";

interface IMobileOnlyWaitingRoom {}

const MobileOnlyWaitingRoom = (props: IMobileOnlyWaitingRoom) => {
  const onMobile = getDeviceType() === "mobile";

  return (
    <BackdropContainer backgroundContainer>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4} xl={1}>
          <ToFrontPageButton />
        </Grid>
        <Grid item xs={12} md={8} xl={11}>
          <Typography>Play only using your mobile.</Typography>
        </Grid>
        <Grid item xs={12}>
          {onMobile ? (
            <BackdropButton
              color="white"
              onClick={() => {
                window.location.href = "/mobileonly";
              }}
            >
              Play only mobile
            </BackdropButton>
          ) : (
            <Typography>
              We have detected that you are not on a mobile and thus you cannot
              play on mobile only. If you think this is a mistake, please
              refresh your browser.
            </Typography>
          )}
        </Grid>
        <Grid item xs={12}>
          <Typography>
            Even though the game is intended to be played on a pc, using your
            phone as a controller, it can be quite fun to play only using the
            mobile. There might be some drop in performance, so we recommend
            turning off shadows and putting graphics in low. Since it is quite
            hard to see the vehicle when turning the phone to steer, the screen
            rotates in the opposite direction so the vehilce is perpandicular to
            the ground in the real world.
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <FullscreenButton />
        </Grid>
        <Grid item xs={6}>
          <Typography>Go into fullscreen by pressing this button.</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography>
            <strong>Use your phone in landscape and go into fullscreen.</strong>
          </Typography>
          <Typography>
            Fullscreen is accessed in game while pausing the game. Note on
            iphones, to enter fullscreen the page needs to be started from a
            bookmark on the homescreen.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <img style={{ maxWidth: "80%", width: 400 }} src={settingsImage} />
        </Grid>
      </Grid>
    </BackdropContainer>
  );
};

export default MobileOnlyWaitingRoom;
