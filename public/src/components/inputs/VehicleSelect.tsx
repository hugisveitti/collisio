import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { inputBackgroundColor } from "../../providers/theme";
import { VehicleType } from "../../shared-backend/shared-stuff";
import { itemInArray } from "../../utils/utilFunctions";
import { allVehicleTypes } from "../../vehicles/VehicleConfigs";
import ShowRoomComponent from "../showRoom/ShowRoomComponent";

interface IVehicleSelect {
  value: VehicleType;
  onChange: (vehicleType: VehicleType) => void;
  previewVehicle?: boolean;
  excludedVehicles?: VehicleType[];
}

const VehicleSelect = ({ ...props }: IVehicleSelect) => {
  const [showPreview, setShowPreview] = useState(false);

  const vehicleOptions = props.excludedVehicles
    ? allVehicleTypes.filter(
        (vehicle) => !itemInArray(vehicle.type, props.excludedVehicles)
      )
    : allVehicleTypes;

  return (
    <React.Fragment>
      <FormControl fullWidth>
        <InputLabel id="vehicle-select">Vehicle</InputLabel>
        <Select
          style={{
            backgroundColor: inputBackgroundColor,
          }}
          label="Vehicle"
          name="vehicle"
          onChange={(e) => {
            props.onChange(e.target.value as VehicleType);
          }}
          value={props.value}
        >
          {vehicleOptions.map((vehicle) => (
            <MenuItem key={vehicle.type} value={vehicle.type}>
              {vehicle.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {props.previewVehicle && (
        <React.Fragment>
          <Button
            style={{ marginTop: 10 }}
            variant="outlined"
            onClick={() => setShowPreview(!showPreview)}
            startIcon={showPreview ? <ExpandMore /> : <ExpandLess />}
          >
            Vehicle preview
          </Button>

          <Collapse in={showPreview} style={{ marginTop: 10 }}>
            {showPreview && (
              <ShowRoomComponent
                excludedVehicles={props.excludedVehicles}
                isPremiumUser={false}
                vehcileType={props.value}
              />
            )}
          </Collapse>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default VehicleSelect;
