import { Button, Grid, IconButton, Modal } from "@mui/material";
import React from "react";
import CloseIcon from "@mui/icons-material/Close";
import { Link, useHistory } from "react-router-dom";
import { frontPagePath, waitingRoomPath } from "./Routes";
import { RaceGameScene } from "../one-monitor-game/race-game";

interface IGameSettingsModal {
  open: boolean;
  onClose: () => void;
  gameObject: RaceGameScene;
}

const GameSettingsModal = (props: IGameSettingsModal) => {
  const history = useHistory();
  if (!props.gameObject) return null;
  return (
    <Modal open={props.open} onClose={props.onClose}>
      <div
        style={{
          transform: "translate(-50%, -50%)",
          position: "absolute",
          top: "50%",
          left: "50%",
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
          <Grid item xs={3}>
            <Button
              variant="contained"
              onClick={() => {
                props.gameObject.setUseShadows(!props.gameObject.useShadows);
              }}
            >
              Toggle Shadows
            </Button>
          </Grid>
          {/* <Grid item xs={3}>
            <Button
              variant="contained"
              onClick={() => {
                history.push(waitingRoomPath + "/" + props.gameObject.roomId);
                // need to alert the mobile devices, clear the canvas, stop the game
              }}
            >
              Back to waiting room
            </Button>
          </Grid> */}
          <Grid item xs={3}>
            <Button
              variant="contained"
              onClick={() => {
                props.gameObject.restartGame();
                props.onClose();
              }}
            >
              Reset game
            </Button>
          </Grid>
        </Grid>
      </div>
    </Modal>
  );
};

export default GameSettingsModal;
