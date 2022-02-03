import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Collapse from "@mui/material/Collapse";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import React, { useState } from "react";
import { IVehicleSettings } from "../../classes/User";
import { getStyledColors } from "../../providers/theme";
import {
  allVehicleTypes,
  VehicleColorType,
  VehicleType,
} from "../../shared-backend/shared-stuff";
import { itemInArray } from "../../utils/utilFunctions";
import { getVehicleNameFromType } from "../../vehicles/VehicleConfigs";
import BackdropButton from "../button/BackdropButton";
import GarageComponent from "../garage/GarageComponent";
import GarageContainer from "../garage/GarageComponent";
import ShowRoomComponent from "../showRoom/ShowRoomComponent";
import { IStore } from "../store";
import "./select.css";

interface IVehicleSelect {
  value: VehicleType;
  onChange: (vehicleType: VehicleType) => void;
  onChangeColor?: (color: VehicleColorType) => void;
  excludedVehicles?: VehicleType[];
  fullWidth?: boolean;
  disabled?: boolean;
  vehicleColor?: string;
  store?: IStore;
  simpleSelect?: boolean;
}

const VehicleSelect = ({ ...props }: IVehicleSelect) => {
  const [open, setOpen] = useState(false);
  const { color, backgroundColor } = getStyledColors("white");
  const vehicleOptions = props.excludedVehicles
    ? allVehicleTypes.filter(
        (vehicle) => !itemInArray(vehicle.type, props.excludedVehicles)
      )
    : allVehicleTypes;

  if (props.simpleSelect) {
    return (
      <>
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
      </>
    );
  }
  return (
    <React.Fragment>
      <span className="select__label" style={{ color, fontSize: 16 }}>
        Selected vehicle is{" "}
        <strong>{getVehicleNameFromType(props.value)}</strong>
      </span>
      {props.store && (
        <React.Fragment>
          <BackdropButton
            disabled={props.disabled}
            style={{ marginTop: 10, marginLeft: 5 }}
            onClick={() => setOpen(!open)}
            startIcon={open ? <ExpandMore /> : <ExpandLess />}
          >
            Select vehicle
          </BackdropButton>
          {open && (
            <GarageComponent
              store={props.store}
              onChangeVehicleColor={(color) => {
                if (props.onChangeColor) {
                  props.onChangeColor(color);
                }
              }}
              onChangeVehicleType={(v) => {
                props.onChange(v);
              }}
            />
          )}
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default VehicleSelect;
