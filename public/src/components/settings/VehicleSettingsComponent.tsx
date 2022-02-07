import Collapse from "@mui/material/Collapse";
import Grid from "@mui/material/Grid";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { IUser, IUserSettings, IVehicleSettings } from "../../classes/User";
import CollabsibleCard from "../../components/inputs/CollapsibleCard";
import VehicleSelect from "../../components/inputs/VehicleSelect";
import { IStore } from "../../components/store";
import { setDBUserSettings } from "../../firebase/firestoreFunctions";
import { setDBVehiclesSetup } from "../../firebase/firestoreOwnershipFunctions";
import { getStyledColors } from "../../providers/theme";
import { mts_user_settings_changed } from "../../shared-backend/shared-stuff";
import { ItemProperties } from "../../shared-backend/vehicleItems";
import { nonactiveVehcileTypes } from "../../vehicles/VehicleConfigs";
import { VehiclesSetup } from "../../vehicles/VehicleSetup";
import BackdropButton from "../button/BackdropButton";
import { garagePagePath } from "../Routes";

interface IVehicleSettingsComponent {
  store: IStore;
  user: IUser;
  resetOrientation?: () => void;
  notInGame?: boolean;
  previewVehicle?: boolean;
  // if true, then the vehicle select is a garage button
  linkToGarage?: boolean;
}

let userSettingsToSave: IUserSettings;
let vehiclesSetupToSave: VehiclesSetup;
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

  const [noSteerNumberDefaultVal, setNoSteerNumberDefaultVal] = useState(
    props.store.userSettings.vehicleSettings.noSteerNumber
  );

  const sendUserSettingsToServer = (newUserSettings: IUserSettings) => {
    // if (user) {
    //   setDBUserSettings(user.uid, newUserSettings);
    //   if (props.store.socket) {
    props.store.socket.emit(mts_user_settings_changed, {
      userSettings: newUserSettings,
      vehicleSetup: undefined,
    });
    props.store.setUserSettings(newUserSettings);
    // }
    // }
  };

  useEffect(() => {
    return () => {
      console.log(
        "unmount vehicle settings",
        vehiclesSetupToSave,
        userSettingsToSave
      );
      if (user?.uid) {
        if (userSettingsToSave) {
          setDBUserSettings(user.uid, userSettingsToSave);
        }
        if (vehiclesSetupToSave) {
          setDBVehiclesSetup(user.uid, vehiclesSetupToSave);
        }
      }
    };
  }, []);

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

    sendUserSettingsToServer(newUserSettings);
  };

  const updateVehicleSetup = (item: ItemProperties) => {
    const newVehiclesSetup = { ...props.store.vehiclesSetup };

    newVehiclesSetup[props.store.userSettings.vehicleSettings.vehicleType][
      item.type
    ] = item;

    props.store.setVehiclesSetup(newVehiclesSetup);
    vehiclesSetupToSave = newVehiclesSetup;

    props.store.socket.emit(mts_user_settings_changed, {
      userSettings: undefined,
      vehicleSetup:
        newVehiclesSetup[props.store.userSettings.vehicleSettings.vehicleType],
    });
  };

  const { color, backgroundColor } = getStyledColors("white");

  return (
    <CollabsibleCard header="Vehicle settings">
      <Grid container spacing={3}>
        <Grid item xs={12} lg={12} style={{}}>
          {props.linkToGarage ? (
            <BackdropButton link={garagePagePath}>Go to garage</BackdropButton>
          ) : (
            <VehicleSelect
              store={props.store}
              value={props.store.userSettings.vehicleSettings.vehicleType}
              excludedVehicles={nonactiveVehcileTypes}
              vehicleColor={
                props.store.userSettings.vehicleSettings.vehicleColor
              }
              onChange={(value) => {
                updateVehicleSettings("vehicleType", value);
              }}
              onChangeColor={(color) => {
                updateVehicleSettings("vehicleColor", color);
              }}
              onChangeVehicleItem={updateVehicleSetup}
              user={props.user}
            />
          )}
        </Grid>
        {/* <Grid item xs={12} lg={6}>
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
        </Grid> */}
        <Grid item xs={6} sm={4}>
          {props.resetOrientation && (
            <BackdropButton onClick={props.resetOrientation}>
              Reset orientation
            </BackdropButton>
          )}
        </Grid>
        <Grid item xs={6} sm={4}>
          <BackdropButton
            onClick={() => {
              updateVehicleSettings(
                "useChaseCamera",
                !props.store.userSettings.vehicleSettings.useChaseCamera
              );
            }}
          >
            <>
              Camera chaser{" "}
              {props.store.userSettings.vehicleSettings.useChaseCamera
                ? "On"
                : "Off"}
            </>
          </BackdropButton>
        </Grid>

        <Grid item xs={12}>
          <Collapse
            in={props.store.userSettings.vehicleSettings.useChaseCamera}
          >
            <Typography>Chase camera speed</Typography>
            <Slider
              style={{ color }}
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
            style={{
              color: "black",
            }}
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
            style={{ color }}
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
        <Grid item xs={12}>
          <Typography>
            No Steer range:
            <i>
              {" "}
              small angle where the vehicle won't turn when the phone turns
            </i>
          </Typography>
          <Slider
            style={{
              color: color,
            }}
            min={0}
            max={5}
            valueLabelDisplay="auto"
            step={0.5}
            defaultValue={noSteerNumberDefaultVal}
            onChange={(e, value) => {}}
            onChangeCommitted={(e, value) => {
              updateVehicleSettings("noSteerNumber", value);
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
