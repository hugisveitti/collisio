import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import React, { useState } from "react";
import { GlobalTournament } from "../../../classes/Tournament";
import MyCheckbox from "../../inputs/checkbox/MyCheckbox";
import MyDateInput from "../../inputs/date-input/MyDateInput";
import MyTextField from "../../textField/MyTextField";

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
      <Grid item xs={12} lg={3}>
        <MyCheckbox
          label="Limit number of runs per player"
          checked={useRunsPerPlayer}
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
      </Grid>

      {useRunsPerPlayer && (
        <Grid item xs={12} lg={3}>
          <MyTextField
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

      <Grid item xs={12} lg={3}>
        <MyCheckbox
          label="Allow joining after game starts"
          checked={props.editTournament.allowLateJoin}
          onChange={() =>
            props.updateTournament(
              "allowLateJoin",
              !props.editTournament.allowLateJoin
            )
          }
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

      <Grid item xs={12} lg={6}>
        <MyDateInput
          label="Tournament start"
          value={startString}
          onChange={(newStart) => {
            props.updateTournament("tournamentStart", newStart);
          }}
          min={nowString}
          max={endString}
        />
      </Grid>
      <Grid item xs={12} lg={false}>
        <Divider
          style={{
            margin: "auto",
            width: 100,
          }}
          variant="middle"
        />
      </Grid>

      <Grid item xs={12} lg={5}>
        <MyDateInput
          label="Tournament End"
          value={endString}
          onChange={(newEnd) => {
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
