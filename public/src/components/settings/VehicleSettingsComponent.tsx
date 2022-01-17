import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Grid from "@mui/material/Grid";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { IUser, IUserSettings, IVehicleSettings } from "../../classes/User";
import CollabsibleCard from "../../components/inputs/CollapsibleCard";
import VehicleSelect from "../../components/inputs/VehicleSelect";
import { IStore } from "../../components/store";
import { setDBUserSettings } from "../../firebase/firestoreFunctions";
import {
  mts_user_settings_changed,
  vehicleColors,
} from "../../shared-backend/shared-stuff";
import {
  getVehicleColorOption,
  nonactiveVehcileTypes,
} from "../../vehicles/VehicleConfigs";
import AnySelect from "../inputs/AnySelect";

interface IVehicleSettingsComponent {
  store: IStore;
  user: IUser;
  resetOrientation?: () => void;
  notInGame?: boolean;
  previewVehicle?: boolean;
}

const VehicleSettingsComponent = (props: IVehicleSettingsComponent) => {
  const user = props.user;

  const [chaseSpeedDefaultVal, setChaseSpeedDefaultVal] = useState(
    props.store.userSettings.vehicleSettings.chaseCameraSpeed
  );

  const [steerSenceDefaultVal, setSteerSenceDefaultVal] = useState(
    props.store.userSettings.vehicleSettings.steeringSensitivity
  );

  const [cameraZoomDefaultVal, setCameraZoomDefaultVal] = useState(
    props.store.userSettings.vehicleSettings.cameraZoom
  );

  const saveUserSettingsToBD = (newUserSettings: IUserSettings) => {
    if (user) {
      setDBUserSettings(user.uid, newUserSettings);
      if (props.store.socket) {
        props.store.socket.emit(mts_user_settings_changed, newUserSettings);
        props.store.setUserSettings(newUserSettings);
      }
    }
  };

  const updateVehicleSettings = (key: keyof IVehicleSettings, value: any) => {
    const newVehicleSettings = {
      ...props.store.userSettings.vehicleSettings,
    } as IVehicleSettings;

    // @ts-ignore
    newVehicleSettings[key] = value;

    const newUserSettings = {
      ...props.store.userSettings,
      vehicleSettings: newVehicleSettings,
    } as IUserSettings;
    props.store.setUserSettings(newUserSettings);
    saveUserSettingsToBD(newUserSettings);
  };

  return (
    <CollabsibleCard header="Vehicle settings">
      <Grid container spacing={3}>
        <Grid item xs={12} lg={12}>
          <VehicleSelect
            previewVehicle={props.previewVehicle}
            value={props.store.userSettings.vehicleSettings.vehicleType}
            excludedVehicles={nonactiveVehcileTypes}
            vehicleColor={props.store.userSettings.vehicleSettings.vehicleColor}
            onChange={(value) => {
              updateVehicleSettings("vehicleType", value);
            }}
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <AnySelect
            selectedValue={getVehicleColorOption(
              props.store.userSettings.vehicleSettings.vehicleColor
            )}
            options={vehicleColors}
            title="Vehicle color"
            onChange={(selected) => {
              updateVehicleSettings("vehicleColor", selected);
            }}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          {props.resetOrientation && (
            <Button
              fullWidth
              variant="outlined"
              onClick={props.resetOrientation}
            >
              Reset orientation
            </Button>
          )}
        </Grid>
        <Grid item xs={6} sm={4}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              updateVehicleSettings(
                "useChaseCamera",
                !props.store.userSettings.vehicleSettings.useChaseCamera
              );
            }}
          >
            Camera chaser{" "}
            {props.store.userSettings.vehicleSettings.useChaseCamera
              ? "On"
              : "Off"}
          </Button>
        </Grid>

        <Grid item xs={12}>
          <Collapse
            in={props.store.userSettings.vehicleSettings.useChaseCamera}
          >
            <Typography>Chase camera speed</Typography>
            <Slider
              min={0.01}
              max={1}
              valueLabelDisplay="auto"
              step={0.01}
              defaultValue={chaseSpeedDefaultVal}
              onChange={(e, value) => {}}
              onChangeCommitted={(e, value) => {
                updateVehicleSettings("chaseCameraSpeed", value);
              }}
            />
          </Collapse>
        </Grid>

        <Grid item xs={12}>
          <Typography>Steering sensitivity</Typography>
          <Slider
            min={0.01}
            max={1}
            valueLabelDisplay="auto"
            step={0.01}
            defaultValue={steerSenceDefaultVal}
            onChange={(e, value) => {}}
            onChangeCommitted={(e, value) => {
              updateVehicleSettings("steeringSensitivity", value);
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography>Camera zoom</Typography>
          <Slider
            min={1}
            max={10}
            valueLabelDisplay="auto"
            step={1}
            defaultValue={cameraZoomDefaultVal}
            onChange={(e, value) => {}}
            onChangeCommitted={(e, value) => {
              updateVehicleSettings("cameraZoom", value);
            }}
          />
        </Grid>
        {!props.notInGame && (
          <Grid item xs={12}>
            <Typography>
              For the vehicle type to update, the leader must restart the game.
            </Typography>
          </Grid>
        )}
      </Grid>
    </CollabsibleCard>
  );
};

export default VehicleSettingsComponent;
