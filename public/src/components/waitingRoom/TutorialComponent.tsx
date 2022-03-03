import { Grid, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import React, { useEffect, useState } from "react";
import {
  getLocalStorageItem,
  saveLocalStorageItem,
} from "../../classes/localStorage";
import BasicDesktopModal from "../modal/BasicDesktopModal";
import handsGIF from "../../images/hands2.gif";
import BackdropButton from "../button/BackdropButton";

let tutorialKey = "hideTutorial";
const TutorialComponent = () => {
  const [hide, setHide] = useState(
    true //getLocalStorageItem<boolean>(tutorialKey, "boolean") ?? false
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setHide(getLocalStorageItem<boolean>(tutorialKey, "boolean") ?? false);
      saveLocalStorageItem(tutorialKey, true + "");
    }, 3000);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return (
    <BasicDesktopModal
      style={{ maxWidth: "90%" }}
      open={!hide}
      onClose={() => {
        setHide(true);
      }}
    >
      <Grid container spacing={3}>
        <Grid item xs={8}>
          <Typography>Welcome to Collisio</Typography>
        </Grid>
        <Grid item xs={4}>
          <IconButton
            style={{ float: "right", color: "white" }}
            onClick={() => {
              setHide(true);
            }}
          >
            <CloseIcon />
          </IconButton>
        </Grid>
        <Grid item xs={12}>
          <Typography>
            Press 'Start Game', connect your phone and start racing!
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <img
            style={{ maxWidth: "90%" }}
            src={handsGIF}
            alt="steer with your phone"
          />
        </Grid>
      </Grid>
    </BasicDesktopModal>
  );
};

export default TutorialComponent;
