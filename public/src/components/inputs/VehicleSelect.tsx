import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import React from "react";
import { toast } from "react-toastify";
import { IPlayerInfo } from "../../classes/Game";
import { IUser } from "../../firebase/firebaseFunctions";
import { inputBackgroundColor } from "../../providers/theme";
import { sendPlayerInfoChanged } from "../../utils/socketFunctions";
import { VehicleType } from "../../vehicles/VehicleConfigs";

interface IVehicleSelect {
  value: VehicleType;
  onChange: (vehicleType: VehicleType) => void;
}

const VehicleSelect = (props: IVehicleSelect) => {
  return (
    <FormControl fullWidth>
      <InputLabel id="vehicle-select">Vehicle</InputLabel>
      <Select
        style={{
          backgroundColor: inputBackgroundColor,
        }}
        label="Vehicle selection"
        name="vehicle"
        onChange={(e) => {
          props.onChange(e.target.value as VehicleType);
        }}
        value={props.value}
      >
        <MenuItem value="normal">Normal</MenuItem>
        <MenuItem value="tractor">Tractor</MenuItem>
        <MenuItem value="f1">F1 car</MenuItem>
        <MenuItem value="monster-truck">Monster truck</MenuItem>
      </Select>
    </FormControl>
  );
};

export default VehicleSelect;
