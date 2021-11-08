import { Modal, Typography, Button } from "@mui/material";
import React, { useState } from "react";
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
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "75%",
          backgroundColor: "#eeebdf",
          border: "2px solid #000",
          padding: 10,
        }}
      >
        <Typography>{props.infoText}</Typography>
        <br />
        <br />
        {showLoginInComponent ? (
          <LoginComponent signInWithPopup={props.signInWithPopup} />
        ) : (
          <Button
            variant="contained"
            onClick={() => setShowLoginInComponent(true)}
          >
            Login
          </Button>
        )}
        <Button onClick={props.onContinoueAsGuest}>Continue as a Guest</Button>
      </div>
    </Modal>
  );
};

export default NotLoggedInModal;
