import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import {
  modalBackgroundColor,
  modalBackgroundColorDark,
} from "../providers/theme";
import LoginComponent from "./LoginComponent";

interface INotLoggedInModal {
  open: boolean;
  onClose: () => void;
  onContinoueAsGuest: () => void;
  infoText: string;
  signInWithPopup?: boolean;
}

const NotLoggedInModal = (props: INotLoggedInModal) => {
  const [showLoginInComponent, setShowLoginInComponent] = useState(false);
  return (
    <Modal open={props.open} onClose={props.onClose}>
      <Grid
        container
        spacing={3}
        style={{
          position: "absolute",
          top: "50%",
          left: "5%",
          transform: "translate(5%, -50%)",
          width: "95%",
          backgroundColor: modalBackgroundColor,
          outline: 0,
          padding: 10,
          maxHeight: "80%",
          overflowY: "auto",
        }}
      >
        <Grid item xs={12}>
          <Typography>{props.infoText}</Typography>
        </Grid>

        {showLoginInComponent ? (
          <Grid item xs={12} style={{ padding: 0 }}>
            <LoginComponent
              onClose={() => setShowLoginInComponent(false)}
              signInWithPopup={props.signInWithPopup}
              backgroundColor={modalBackgroundColorDark}
            />
          </Grid>
        ) : (
          <Grid item xs={6}>
            <Button
              disableElevation
              variant="contained"
              onClick={() => setShowLoginInComponent(true)}
            >
              Login
            </Button>
          </Grid>
        )}
        <Grid item xs={6}>
          <Button onClick={props.onContinoueAsGuest}>
            Continue as a Guest
          </Button>
        </Grid>
      </Grid>
    </Modal>
  );
};

export default NotLoggedInModal;
