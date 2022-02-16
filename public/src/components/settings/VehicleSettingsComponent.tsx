import Collapse from "@mui/material/Collapse";
import Grid from "@mui/material/Grid";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { IUser, IUserSettings, IVehicleSettings } from "../../classes/User";
import CollabsibleCard from "../inputs/CollapsibleCard";
import VehicleSelect from "../inputs/VehicleSelect";
import { IStore } from "../store";
import { setDBUserSettings } from "../../firebase/firestoreFunctions";
import { setDBVehiclesSetup } from "../../firebase/firestoreOwnershipFunctions";
import { getStyledColors } from "../../providers/theme";
import { mts_user_settings_changed } from "../../shared-backend/shared-stuff";
import {
  ItemProperties,
  possibleVehicleItemTypes,
  VehicleSetup,
} from "../../shared-backend/vehicleItems";
import { nonactiveVehcileTypes } from "../../vehicles/VehicleConfigs";
import { VehiclesSetup } from "../../vehicles/VehicleSetup";
import BackdropButton from "../button/BackdropButton";
import MySlider from "../inputs/slider/MySlider";
import MyRadio from "../radio/MyRadio";
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

  const [moreSettingsOpen, setMoreSettingsOpen] = useState(false);

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
    userSettingsToSave = newUserSettings;

    sendUserSettingsToServer(newUserSettings);
  };

  const updateVehicleSetup = (item: ItemProperties) => {
    const newVehiclesSetup = { ...props.store.vehiclesSetup };

    newVehiclesSetup[props.store.userSettings.vehicleSettings.vehicleType][
      item.type
    ] = item;

    props.store.setVehiclesSetup(newVehiclesSetup);
    vehiclesSetupToSave = newVehiclesSetup;

    sendVehicleSetupToServer(
      newVehiclesSetup[props.store.userSettings.vehicleSettings.vehicleType]
    );
  };

  const sendVehicleSetupToServer = (vehicleSetup: VehicleSetup) => {
    props.store.socket.emit(mts_user_settings_changed, {
      userSettings: undefined,
      vehicleSetup,
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
              onUnequipAllItems={() => {
                const newVehicleSetup = { ...props.store.vehiclesSetup };

                for (let item of possibleVehicleItemTypes) {
                  delete newVehicleSetup[
                    props.store.userSettings.vehicleSettings.vehicleType
                  ][item];
                }
                props.store.setVehiclesSetup(newVehicleSetup);
                sendVehicleSetupToServer({
                  vehicleType:
                    props.store.userSettings.vehicleSettings.vehicleType,
                });
              }}
              user={props.user}
            />
          )}
        </Grid>
        <Grid item xs={12}>
          <CollabsibleCard header="More vehicle settings">
            <Grid container spacing={1}>
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
                <MySlider
                  label="Steering sensitivity"
                  color={color}
                  min={0.01}
                  max={1}
                  //      valueLabelDisplay="auto"
                  step={0.01}
                  value={steerSenceDefaultVal}
                  onChange={(value) => {}}
                  onChangeCommitted={(value) => {
                    updateVehicleSettings(
                      "steeringSensitivity",
                      value as number
                    );
                  }}
                  startIcon={<span>-</span>}
                  endIcon={<span>+</span>}
                />
              </Grid>
              <Grid item xs={12}>
                <MySlider
                  label="Camera position"
                  color={color}
                  min={1}
                  max={10}
                  //    valueLabelDisplay="auto"
                  step={1}
                  value={cameraZoomDefaultVal}
                  onChange={(value) => {}}
                  onChangeCommitted={(value) => {
                    updateVehicleSettings("cameraZoom", value as number);
                  }}
                  startIcon={<span>Close</span>}
                  endIcon={<span>Far</span>}
                />
              </Grid>
              <Grid item xs={12}>
                <MySlider
                  label={
                    <>
                      No Steer range:
                      <i>
                        {" "}
                        small angle where the vehicle won't turn when the phone
                        turns
                      </i>
                    </>
                  }
                  color={color}
                  min={0}
                  max={5}
                  //       valueLabelDisplay="auto"
                  step={0.5}
                  value={noSteerNumberDefaultVal}
                  onChange={(value) => {}}
                  onChangeCommitted={(value) => {
                    updateVehicleSettings("noSteerNumber", value as number);
                  }}
                  startIcon={<span>-</span>}
                  endIcon={<span>+</span>}
                />
              </Grid>
              <Grid item xs={12}>
                <MyRadio<boolean>
                  options={[
                    { label: "On", value: true },
                    { label: "Off", value: false },
                  ]}
                  label="Dynamic camera field of view"
                  checked={
                    props.store.userSettings.vehicleSettings.useDynamicFOV
                  }
                  onChange={(newVal) => {
                    updateVehicleSettings("useDynamicFOV", newVal);
                  }}
                />
              </Grid>
              {!props.notInGame && (
                <Grid item xs={12}>
                  <Typography>
                    For the vehicle type to update, the leader must restart the
                    game.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CollabsibleCard>
        </Grid>
      </Grid>
    </CollabsibleCard>
  );
};

export default VehicleSettingsComponent;
