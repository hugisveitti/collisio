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
import { getStyledColors, inputBackgroundColor } from "../../providers/theme";
import { VehicleType } from "../../shared-backend/shared-stuff";
import { itemInArray } from "../../utils/utilFunctions";
import { allVehicleTypes } from "../../vehicles/VehicleConfigs";
import BackdropButton from "../button/BackdropButton";
import ShowRoomComponent from "../showRoom/ShowRoomComponent";
import "./select.css";

interface IVehicleSelect {
  value: VehicleType;
  onChange: (vehicleType: VehicleType) => void;
  previewVehicle?: boolean;
  excludedVehicles?: VehicleType[];
  fullWidth?: boolean;
  disabled?: boolean;
  vehicleColor?: string;
}

const VehicleSelect = ({ ...props }: IVehicleSelect) => {
  const [showPreview, setShowPreview] = useState(false);
  const { color, backgroundColor } = getStyledColors("white");
  const vehicleOptions = props.excludedVehicles
    ? allVehicleTypes.filter(
        (vehicle) => !itemInArray(vehicle.type, props.excludedVehicles)
      )
    : allVehicleTypes;

  return (
    <React.Fragment>
      <span className="select__label" style={{ color: backgroundColor }}>
        Vehicle
      </span>
      <FormControl fullWidth={props.fullWidth}>
        <Select
          className="select"
          disabled={props.disabled}
          name="vehicle"
          onChange={(e) => {
            props.onChange(e.target.value as VehicleType);
          }}
          value={props.value}
          style={{ color, backgroundColor }}
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
          <BackdropButton
            style={{ marginTop: 10, marginLeft: 5 }}
            onClick={() => setShowPreview(!showPreview)}
            startIcon={showPreview ? <ExpandMore /> : <ExpandLess />}
          >
            Vehicle preview
          </BackdropButton>
          <Collapse in={showPreview} style={{ marginTop: 10 }}>
            {showPreview && (
              <ShowRoomComponent
                excludedVehicles={props.excludedVehicles}
                isPremiumUser={false}
                vehcileType={props.value}
                vehicleColor={props.vehicleColor}
              />
            )}
          </Collapse>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default VehicleSelect;
