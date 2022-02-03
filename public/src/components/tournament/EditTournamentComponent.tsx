import Collapse from "@mui/material/Collapse";
import Grid from "@mui/material/Grid";
import React, { useState } from "react";
import {
  nonActiveTrackNames,
  numberOfLapsPossibilities,
} from "../../classes/Game";
import {
  GlobalTournament,
  LocalTournament,
  Tournament,
} from "../../classes/Tournament";
import { IUser } from "../../classes/User";
import { inputBackgroundColor } from "../../providers/theme";
import { nonactiveVehcileTypes } from "../../vehicles/VehicleConfigs";
import MyCheckbox from "../inputs/checkbox/MyCheckbox";
import NumberSelect from "../inputs/NumberSelect";
import TrackSelect from "../inputs/TrackSelect";
import VehicleSelect from "../inputs/VehicleSelect";
import MyTextField from "../textField/MyTextField";
import EditGlobalTournamentComponent from "./globalTournament/EditGlocalTournament";
import EditLocalTournamentComponent from "./localTournament/EditLocalTournamentComponent";

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
      <Grid item xs={12} lg={4}>
        <MyTextField
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
        <Collapse in={onlyAllowSpecificVechileType}>
          <VehicleSelect
            value={
              onlyAllowSpecificVechileType
                ? props.tournament.vehicleType
                : "normal2"
            }
            onChange={(vehicleType) => {
              updateTournament("vehicleType", vehicleType);
            }}
            excludedVehicles={nonactiveVehcileTypes}
          />
        </Collapse>
      </Grid>
      <Grid item xs={12} lg={4}>
        <NumberSelect
          title="No. of laps"
          value={props.tournament.numberOfLaps}
          numbers={numberOfLapsPossibilities}
          onChange={(val) => {
            updateTournament("numberOfLaps", val);
          }}
          style={{
            backgroundColor: inputBackgroundColor,
          }}
        />
      </Grid>

      <Grid item xs={12} lg={4}>
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

      <Grid item xs={12} lg={4}>
        <MyCheckbox
          label="Only allow specific vehicle"
          checked={onlyAllowSpecificVechileType}
          onChange={() => {
            setOnlyAllowSpecificVechileType(!onlyAllowSpecificVechileType);
            if (!onlyAllowSpecificVechileType) {
              updateTournament("vehicleType", "normal2");
            } else {
              // will give bug
              updateTournament("vehicleType", false);
            }
          }}
        />
      </Grid>

      {renderSpecificTournament()}
    </React.Fragment>
  );
};

export default EditTournamentComponent;
