import { Grid, IconButton, Modal } from "@mui/material";
import React from "react";
import CloseIcon from "@mui/icons-material/Close";
import { Link } from "react-router-dom";
import { frontPagePath } from "./Routes";

interface IGameSettingsModal {
  open: boolean;
  onClose: () => void;
}
const GameSettingsModal = (props: IGameSettingsModal) => {
  return (
    <Modal open={props.open} onClose={props.onClose}>
      <div
        style={{
          transform: "translate(-50%, -50%)",
          position: "absolute",
          top: "50%",
          //marginTop: 50,

          backgroundColor: "#eeebdf",
          border: "2px solid #000",
          padding: 10,
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={9} />
          <Grid item xs={3}>
            <IconButton onClick={props.onClose}>
              <CloseIcon />
            </IconButton>
          </Grid>
          <Grid item xs={12}>
            <h3>Game is paused</h3>
          </Grid>

          <Grid item xs={12}>
            <Link to={frontPagePath}>Back to front page</Link>
          </Grid>
        </Grid>
      </div>
    </Modal>
  );
};

export default GameSettingsModal;
