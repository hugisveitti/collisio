import { Collapse, FormControlLabel } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import React, { useEffect, useState } from "react";
import { nonActiveTrackNames } from "../../classes/Game";
import {
  GlobalTournament,
  LocalTournament,
  Tournament,
} from "../../classes/Tournament";
import { IUser } from "../../classes/User";
import TrackSelect from "../inputs/TrackSelect";
import VehicleSelect from "../inputs/VehicleSelect";
import EditGlobalTournamentComponent from "./EditGlocalTournament";
import EditLocalTournamentComponent from "./EditLocalTournamentComponent";

interface IEditTournamentComponent<V> {
  user: IUser;
  tournament: V;
  //   setTournament: (newtournament: V) => void;
  updateTournament: (key: keyof V, value: any) => void;
}

const EditTournamentComponent: <T extends LocalTournament | GlobalTournament>(
  p: IEditTournamentComponent<T>
) => React.ReactElement<IEditTournamentComponent<T>> = (props) => {
  const [onlyAllowSpecificVechileType, setOnlyAllowSpecificVechileType] =
    useState(false);

  const updateTournament = (key: keyof Tournament, value: any) => {
    props.updateTournament(key, value);
  };

  const renderSpecificTournament = () => {
    if (props.tournament.tournamentType === "local") {
      return (
        <EditLocalTournamentComponent
          editTournament={props.tournament as LocalTournament}
          updateTournament={updateTournament}
        />
      );
    }

    return (
      <EditGlobalTournamentComponent
        editTournament={props.tournament as GlobalTournament}
        updateTournament={updateTournament}
      />
    );
  };

  return (
    <React.Fragment>
      <Grid item xs={12}>
        <TextField
          label="Tournament name"
          value={props.tournament.name}
          onChange={(e) => {
            if (e.target.value.length <= 32) {
              updateTournament("name", e.target.value);
            }
          }}
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          label="Only allow specific vehcile"
          control={
            <Checkbox
              value={onlyAllowSpecificVechileType}
              onChange={() => {
                setOnlyAllowSpecificVechileType(!onlyAllowSpecificVechileType);
                if (!onlyAllowSpecificVechileType) {
                  updateTournament("vehicleType", "normal");
                } else {
                  // will give bug
                  updateTournament("vehicleType", undefined);
                }
              }}
            />
          }
        />
      </Grid>

      <Grid item xs={12}>
        <Collapse in={onlyAllowSpecificVechileType}>
          <VehicleSelect
            value={
              onlyAllowSpecificVechileType
                ? props.tournament.vehicleType
                : "normal"
            }
            onChange={(vehicleType) => {
              updateTournament("vehicleType", vehicleType);
            }}
          />
        </Collapse>
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Number of laps"
          type="number"
          value={
            props.tournament.numberOfLaps ? props.tournament.numberOfLaps : ""
          }
          onChange={(e) => {
            updateTournament("numberOfLaps", +e.target.value);
          }}
        />
      </Grid>

      <Grid item xs={12}>
        <TrackSelect
          gameType="race"
          value={props.tournament.trackName}
          excludedTracks={nonActiveTrackNames}
          onChange={(trackName) => {
            updateTournament("trackName", trackName);
          }}
          showMapPreview
        />
      </Grid>

      {renderSpecificTournament()}
    </React.Fragment>
  );
};

export default EditTournamentComponent;
