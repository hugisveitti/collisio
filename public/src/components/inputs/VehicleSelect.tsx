import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import {
  Button,
  Collapse,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import React, { useState } from "react";
import { inputBackgroundColor } from "../../providers/theme";
import { VehicleType } from "../../shared-backend/shared-stuff";
import { stringInArray } from "../../utils/utilFunctions";
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
        (vehicle) => !stringInArray(vehicle.type, props.excludedVehicles)
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
            <ShowRoomComponent
              excludedVehicles={props.excludedVehicles}
              isPremiumUser={false}
            />
          </Collapse>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default VehicleSelect;