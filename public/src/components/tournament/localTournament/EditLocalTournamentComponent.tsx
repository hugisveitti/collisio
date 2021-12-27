import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React from "react";
import { LocalTournament } from "../../../classes/Tournament";
import NumberSelect from "../../inputs/NumberSelect";

interface IEditLocalTournamentComponent {
  editTournament: LocalTournament;
  updateTournament: (key: keyof LocalTournament, value: any) => void;
}

const EditLocalTournamentComponent = (props: IEditLocalTournamentComponent) => {
  return (
    <React.Fragment>
      <Grid item xs={12}>
        <FormControlLabel
          label="Use lower bracket"
          control={
            <Checkbox
              value={props.editTournament.useLowerbracket}
              onChange={() =>
                props.updateTournament(
                  "useLowerbracket",
                  !props.editTournament.useLowerbracket
                )
              }
            />
          }
        />
      </Grid>

      <Grid item xs={12}>
        <NumberSelect
          value={props.editTournament.numberOfGamesInSeries}
          onChange={(value) =>
            props.updateTournament("numberOfGamesInSeries", value)
          }
          numbers={[1, 3, 5, 7]}
          title="Number of games per series"
        />
      </Grid>

      <Grid item xs={12}>
        <Divider variant="middle" />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          label="Use group stage to determine bracket placement"
          control={
            <Checkbox
              onChange={() =>
                props.updateTournament(
                  "useGroupStageToDetermineBracketPlacement",
                  !props.editTournament.useGroupStageToDetermineBracketPlacement
                )
              }
              value={
                props.editTournament.useGroupStageToDetermineBracketPlacement
              }
            />
          }
        />
      </Grid>
      <Grid item xs={12}>
        <Typography>
          The group stage is either played with four or 2 player splitscreen.
          This determines the bracet placement. The player with the best time
          competes agains the player with the worst time.
        </Typography>
      </Grid>
    </React.Fragment>
  );
};

export default EditLocalTournamentComponent;
