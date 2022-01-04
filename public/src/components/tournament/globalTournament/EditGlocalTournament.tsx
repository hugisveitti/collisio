import Divider from "@mui/material/Divider";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { GlobalTournament } from "../../../classes/Tournament";

interface IEditGlobalTournamentComponent {
  editTournament: GlobalTournament;
  updateTournament: (key: keyof GlobalTournament, value: any) => void;
}

const EditGlobalTournamentComponent = (
  props: IEditGlobalTournamentComponent
) => {
  const [useRunsPerPlayer, setUseRunsPerPlayer] = useState(
    !!props.editTournament.runsPerPlayer
  );
  console.log("edit torunament", props.editTournament);
  console.log("start", props.editTournament.tournamentStart.toISOString());

  const startString = props.editTournament.tournamentStart
    .toISOString()
    .slice(0, 16);
  const endString = props.editTournament.tournamentEnd
    .toISOString()
    .slice(0, 16);

  const nowString = new Date().toISOString().slice(0, 16);

  console.log("start string", startString);
  return (
    <React.Fragment>
      <Grid item xs={12}>
        <FormControlLabel
          label="Limit number of runs per player"
          control={
            <Checkbox
              value={useRunsPerPlayer}
              onChange={() => {
                setUseRunsPerPlayer(!useRunsPerPlayer);
                if (!useRunsPerPlayer) {
                  props.updateTournament("runsPerPlayer", 1);
                } else {
                  // will give bug
                  props.updateTournament("runsPerPlayer", false);
                }
              }}
            />
          }
        />
      </Grid>
      {useRunsPerPlayer && (
        <Grid item xs={12}>
          <TextField
            type="number"
            label="Runs per player"
            value={
              props.editTournament.runsPerPlayer
                ? props.editTournament.runsPerPlayer
                : ""
            }
            onChange={(e) =>
              props.updateTournament("runsPerPlayer", +e.target.value)
            }
          />
        </Grid>
      )}

      <Grid item xs={12}>
        <Divider
          style={{
            margin: "auto",
            width: 100,
          }}
          variant="middle"
        />
      </Grid>
      <Grid item xs={12}>
        <Typography>Tournament start</Typography>
      </Grid>
      <Grid item xs={12}>
        <input
          type="datetime-local"
          id="tournament-start-time"
          name="tournament-start-time"
          value={startString}
          onChange={(e) => {
            console.log("change", e);
            console.log("val", e.target.value);
            const newStart = new Date(e.target.value);
            console.log("new start", newStart);
            props.updateTournament("tournamentStart", newStart);
          }}
          min={nowString}
          max={endString}
        />
      </Grid>
      <Grid item xs={12}>
        <Divider
          style={{
            margin: "auto",
            width: 100,
          }}
          variant="middle"
        />
      </Grid>
      <Grid item xs={12}>
        <Typography>Tournament End</Typography>
      </Grid>
      <Grid item xs={12}>
        <input
          type="datetime-local"
          id="tournament-end-time"
          name="tournament-end-time"
          value={endString}
          onChange={(e) => {
            console.log("change", e);
            console.log("val", e.target.value);
            const newEnd = new Date(e.target.value);
            console.log("new end", newEnd);
            props.updateTournament("tournamentEnd", newEnd);
          }}
          min={startString}
          max="2099-06-14T00:00"
        />
      </Grid>
    </React.Fragment>
  );
};

export default EditGlobalTournamentComponent;
