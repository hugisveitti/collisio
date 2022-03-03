import { Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import React from "react";
import BackdropButton from "../button/BackdropButton";
import BasicDesktopModal from "../modal/BasicDesktopModal";
import { singlePlayerWaitingRoomPath } from "../Routes";

interface INotCorrectCountryComponent {
  inEurope: boolean;
  country: string;
  onClose: () => void;
}

const NotCorrectCountryComponent = (props: INotCorrectCountryComponent) => {
  return (
    <BasicDesktopModal onClose={props.onClose} open={!props.inEurope}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography>
            We have detected that your are in {props.country}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography>
            Unfortunately the mobile controller mechanism is only available in
            Europe at the moment. You can still play the keyboard version. If
            you think this is a mistake simple close this prompt. If you decide
            to try anyway be warned that there might be lag from the controller.
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} lg={2}>
          <BackdropButton link={singlePlayerWaitingRoomPath}>
            Play with keyboard
          </BackdropButton>
        </Grid>
        <Grid item xs={12} sm={6} lg={6}>
          <BackdropButton onClick={() => props.onClose()}>
            Play mobile controller (not recommended)
          </BackdropButton>
        </Grid>
      </Grid>
    </BasicDesktopModal>
  );
};

export default NotCorrectCountryComponent;
