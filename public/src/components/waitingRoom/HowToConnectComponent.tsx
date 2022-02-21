import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  IconButton,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import React, { useEffect, useState } from "react";
import {
  getLocalStorageItem,
  saveLocalStorageItem,
} from "../../classes/localStorage";
import { getDeviceType } from "../../utils/settings";
import BackdropButton from "../button/BackdropButton";
import BasicModal from "../modal/BasicModal";
import step1Img from "../../images/how-to-connect/1.jpg";
import step2Img from "../../images/how-to-connect/2.jpg";
import step3Img from "../../images/how-to-connect/3.jpg";
import BasicDesktopModal from "../modal/BasicDesktopModal";

const steps = [
  {
    label: "Open Collisio on your phone",
    description: (extra: string) =>
      "Go to https://collisio.club on your phone and press 'Join a Game'",
    image: step1Img,
  },
  {
    label: "Write the room id",
    description: (roomId: string) =>
      `Write your name in the player name text field and then write your room id ${roomId}, into the room id text field and press 'Join Game'`,
    image: step2Img,
  },
  {
    label: "Connection to the room",
    description: () =>
      "After connecting you will appear in the players list, both on the desktop and on your phone",
    image: step3Img,
  },
];

interface IHowToConnectComponent {
  roomId: string;
}

const HowToConnectComponent = (props: IHowToConnectComponent) => {
  let storageKey = "hasShownHowToConnect";
  const [hasShown, setHasShown] = useState(
    true //  getLocalStorageItem<boolean>(storageKey, "boolean") ?? false
  );

  const onMobile = getDeviceType() === "mobile";

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setTimeout(() => {
      setHasShown(getLocalStorageItem<boolean>(storageKey, "boolean") ?? false);
    }, 2000); // show after 3 secs
  }, []);

  // only show on desktop
  if (onMobile) return null;

  return (
    <React.Fragment>
      <BasicDesktopModal
        open={!hasShown}
        onClose={() => setHasShown(true)}
        outline
        color="white"
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={2} lg={1}>
            <IconButton
              onClick={() => setHasShown(true)}
              style={{ color: "black" }}
            >
              <CloseIcon />
            </IconButton>
          </Grid>
          <Grid item xs={12} md={10} lg={11}>
            <BackdropButton
              onClick={() => {
                setHasShown(true);
                saveLocalStorageItem(storageKey, "true");
              }}
            >
              Never show again
            </BackdropButton>
          </Grid>
          <Grid item xs={12}>
            <span style={{ fontSize: 24 }}>How to connect your mobile</span>
          </Grid>
          <Grid item xs={12}>
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel
                    optional={
                      index === 2 ? (
                        <Typography variant="caption">Last step</Typography>
                      ) : null
                    }
                  >
                    {step.label}
                  </StepLabel>
                  <StepContent>
                    <div style={{ marginBottom: 25 }}>
                      <BackdropButton
                        style={{ display: "inline", marginRight: 35 }}
                        //disabled={index === steps.length - 1}
                        onClick={() => setActiveStep(activeStep + 1)}
                      >
                        {index === steps.length - 1 ? "Finish" : "Continue"}
                      </BackdropButton>
                      <BackdropButton
                        style={{ display: "inline" }}
                        disabled={index === 0}
                        onClick={() => setActiveStep(activeStep - 1)}
                      >
                        Back
                      </BackdropButton>
                    </div>
                    <Typography>{step.description(props.roomId)}</Typography>
                    <img src={step.image} style={{ width: 300 }} />
                    <Box sx={{ mb: 2 }}></Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Grid>
        </Grid>
      </BasicDesktopModal>
    </React.Fragment>
  );
};

export default HowToConnectComponent;
