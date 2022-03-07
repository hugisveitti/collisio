import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import React, { useState } from "react";
import { IUser } from "../../classes/User";
import { getStyledColors } from "../../providers/theme";
import {
  allVehicleTypes,
  VehicleColorType,
  VehicleType,
} from "../../shared-backend/shared-stuff";
import { ItemProperties } from "../../shared-backend/vehicleItems";
import { itemInArray } from "../../utils/utilFunctions";
import { getVehicleNameFromType } from "../../vehicles/VehicleConfigs";
import BackdropButton from "../button/BackdropButton";
import GarageComponent from "../garage/GarageComponent";
import { loginPagePath } from "../Routes";
import { IStore } from "../store";
import "./select.css";

interface IVehicleSelect {
  value: VehicleType;
  onChange: (vehicleType: VehicleType) => void;
  onChangeColor?: (color: VehicleColorType) => void;
  excludedVehicles?: VehicleType[];
  onChangeVehicleItem?: (item: ItemProperties) => void;

  fullWidth?: boolean;
  disabled?: boolean;
  store?: IStore;
  simpleSelect?: boolean;
  user: IUser;
  onUnequipAllItems?: () => void;
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
      {!props.user && (
        <div>
          <span className="select__label" style={{ color, fontSize: 16 }}>
            <i>
              Vehicle selection is only available for logged in users. Click
              below to create a free account.
            </i>
          </span>
          <BackdropButton link={loginPagePath}>
            Create a free account.
          </BackdropButton>
        </div>
      )}
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
                if (!props.user) {
                  return;
                }
                if (props.onChangeColor) {
                  props.onChangeColor(color);
                }
              }}
              onChangeVehicleType={(v) => {
                if (!props.user) {
                  return;
                }
                props.onChange(v);
              }}
              onChangeVehicleItem={(item) => {
                props.onChangeVehicleItem?.(item);
              }}
              onUnequipAllItems={() => {
                props.onUnequipAllItems?.();
              }}
            />
          )}
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default VehicleSelect;
