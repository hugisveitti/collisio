import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import React, { useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import {
  Collapse,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Tooltip,
} from "@mui/material";
import VehicleSelect from "../inputs/VehicleSelect";
import TrackSelect from "../inputs/TrackSelect";
import { nonActiveTrackNames } from "../../classes/Game";
import NumberSelect from "../inputs/NumberSelect";

const CreateLocalTournamentComponent = () => {
  const [onlyAllowSpecificVechileType, setOnlyAllowSpecificVechileType] =
    useState(false);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography>
          Local tournaments are for players that are physically together. The
          format is a knockout tournament, where two players face off in each
          round, the winner advances until there is one player left. In the
          knockout tournament there is also the possibility of having a lower
          bracket, this way everyone plays the same amount of games.
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Divider variant="middle" />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h5">Create local tournament</Typography>
      </Grid>
      <Grid item xs={12}>
        <TextField label="Tournament name" />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel label="Use lower bracket" control={<Checkbox />} />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          label="Only allow specific vehcile"
          control={
            <Checkbox
              value={onlyAllowSpecificVechileType}
              onChange={() =>
                setOnlyAllowSpecificVechileType(!onlyAllowSpecificVechileType)
              }
            />
          }
        />
      </Grid>

      <Grid item xs={12}>
        <Collapse in={onlyAllowSpecificVechileType}>
          <VehicleSelect
            value="normal"
            onChange={(vehicleType) => {
              console.log("not imple");
            }}
          />
        </Collapse>
      </Grid>
      <Grid item xs={12}>
        <TextField label="Number of laps" />
      </Grid>
      <Grid item xs={12}>
        <TextField label="Number of games per series" />
      </Grid>
      <Grid item xs={12}>
        <NumberSelect
          value={3}
          onChange={() => console.log("not impl")}
          numbers={[1, 3, 5, 7]}
          title="Number of games per series"
        />
      </Grid>
      <Grid item xs={12}>
        <TrackSelect
          gameType="race"
          value="farm-track"
          excludedTracks={nonActiveTrackNames}
          onChange={(trackName) => {
            console.log("not impl");
          }}
          showMapPreview
        />
      </Grid>

      <Grid item xs={12}>
        <Divider variant="middle" />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          label="Use group stage to determine bracket placement"
          control={<Checkbox />}
        />
      </Grid>
      <Grid item xs={12}>
        <Typography>
          The group stage is either played with four or 2 player splitscreen.
          This determines the bracet placement. The player with the best time
          competes agains the player with the worst time.
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Divider variant="middle" />
      </Grid>
      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormLabel component="legend">
            How to determine bracket/group placement?
          </FormLabel>
          <RadioGroup
            row
            aria-label="determine bracet placement"
            name="determine-radio-buttons-group"
            style={{ margin: "auto" }}
          >
            <FormControlLabel
              value="random"
              control={<Radio />}
              label="Random"
            />
            <FormControlLabel
              value="manual"
              control={<Radio />}
              label="Manual"
            />
          </RadioGroup>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default CreateLocalTournamentComponent;
