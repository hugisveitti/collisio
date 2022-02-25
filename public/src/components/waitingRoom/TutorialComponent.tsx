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
    }, 3000);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return (
    <BasicDesktopModal
      open={!hide}
      onClose={() => {
        saveLocalStorageItem(tutorialKey, true + "");
        setHide(true);
      }}
    >
      <Grid container spacing={3}>
        <Grid item xs={11}>
          <Typography>Welcome to Collisio</Typography>
        </Grid>
        <Grid item xs={1}>
          <IconButton
            style={{ float: "right", color: "white" }}
            onClick={() => {
              saveLocalStorageItem(tutorialKey, true + "");
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
          <img src={handsGIF} alt="steer with your phone" />
        </Grid>
      </Grid>
    </BasicDesktopModal>
  );
};

export default TutorialComponent;
