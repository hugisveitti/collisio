import Collapse from "@mui/material/Collapse";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { IUser, IUserSettings, IVehicleSettings } from "../../classes/User";
import { setDBUserSettings } from "../../firebase/firestoreFunctions";
import { setDBVehiclesSetup } from "../../firebase/firestoreOwnershipFunctions";
import { getStyledColors } from "../../providers/theme";
import { mts_user_settings_changed } from "../../shared-backend/shared-stuff";
import {
  ItemProperties,
  possibleVehicleItemTypes,
  VehicleSetup,
} from "../../shared-backend/vehicleItems";
import { getSocket } from "../../utils/connectSocket";
import { nonactiveVehcileTypes } from "../../vehicles/VehicleConfigs";
import { VehiclesSetup } from "../../vehicles/VehicleSetup";
import BackdropButton from "../button/BackdropButton";
import CollabsibleCard from "../inputs/CollapsibleCard";
import MySlider from "../inputs/slider/MySlider";
import VehicleSelect from "../inputs/VehicleSelect";
import MyRadio from "../radio/MyRadio";
import { garagePagePath } from "../Routes";
import { IStore } from "../store";

interface IVehicleSettingsComponent {
  store: IStore;
  user: IUser;
  resetOrientation?: () => void;
  notInGame?: boolean;
  previewVehicle?: boolean;
  // if true, then the vehicle select is a garage button
  linkToGarage?: boolean;
  maxWidth?: string | number;
}

let userSettingsToSave: IUserSettings;
let vehiclesSetupToSave: VehiclesSetup;
const VehicleSettingsComponent = (props: IVehicleSettingsComponent) => {
  const user = props.user;
  const socket = getSocket();

  const [vehicleSettings, setVehicleSettings] = useState(
    props.store.userSettings.vehicleSettings
  );

  const sendUserSettingsToServer = (
    newUserSettings: IUserSettings,
    vehicleSetup
  ) => {
    // if (user) {
    //   setDBUserSettings(user.uid, newUserSettings);
    //   if (socket) {
    socket?.emit(mts_user_settings_changed, {
      userSettings: newUserSettings,
      vehicleSetup,
    });

    // }
    // }
  };

  useEffect(() => {
    return () => {
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

  const updateVehicleSettings = (
    key: keyof IVehicleSettings,
    value: any,
    notEmit?: boolean
  ) => {
    const newVehicleSettings = {
      ...vehicleSettings,
    } as IVehicleSettings;

    // @ts-ignore
    newVehicleSettings[key] = value;

    const newUserSettings = {
      ...props.store.userSettings,
      vehicleSettings: newVehicleSettings,
    } as IUserSettings;
    props.store.setUserSettings(newUserSettings);
    setVehicleSettings(newVehicleSettings);
    userSettingsToSave = newUserSettings;

    let vehicleSetup = undefined;
    if (key === "vehicleType") {
      vehicleSetup = props.store.vehiclesSetup[value];
    }

    if (!notEmit) {
      sendUserSettingsToServer(newUserSettings, vehicleSetup);
    }
  };

  const updateVehicleSetup = (item: ItemProperties) => {
    const newVehiclesSetup = { ...props.store.vehiclesSetup };

    newVehiclesSetup[vehicleSettings.vehicleType][item.type] = item;

    props.store.setVehiclesSetup(newVehiclesSetup);
    vehiclesSetupToSave = newVehiclesSetup;

    sendVehicleSetupToServer(newVehiclesSetup[vehicleSettings.vehicleType]);
  };

  const sendVehicleSetupToServer = (vehicleSetup: VehicleSetup) => {
    socket?.emit(mts_user_settings_changed, {
      userSettings: undefined,
      vehicleSetup,
    });
  };

  const { color, backgroundColor } = getStyledColors("white");

  return (
    <CollabsibleCard header="Vehicle settings" maxWidth={props.maxWidth}>
      <Grid container spacing={3}>
        <Grid item xs={12} lg={12} style={{}}>
          {props.linkToGarage ? (
            <BackdropButton link={garagePagePath}>Go to garage</BackdropButton>
          ) : (
            <VehicleSelect
              store={props.store}
              value={vehicleSettings.vehicleType}
              excludedVehicles={nonactiveVehcileTypes}
              onChange={(value) => {
                updateVehicleSettings("vehicleType", value);
              }}
              onChangeColor={(color) => {
                // updateVehicleSettings("vehicleColor", color);
                const newVehicleSetup: VehicleSetup = {
                  ...props.store.vehiclesSetup[vehicleSettings.vehicleType],
                  vehicleColor: color,
                };
                const newVehiclesSetup = {
                  ...props.store.vehiclesSetup,
                };
                newVehiclesSetup[vehicleSettings.vehicleType] = newVehicleSetup;
                props.store.setVehiclesSetup(newVehiclesSetup);
                sendVehicleSetupToServer(newVehicleSetup);
              }}
              onChangeVehicleItem={updateVehicleSetup}
              onUnequipAllItems={() => {
                const newVehiclesSetup = { ...props.store.vehiclesSetup };

                for (let item of possibleVehicleItemTypes) {
                  delete newVehiclesSetup[vehicleSettings.vehicleType][item];
                }

                props.store.setVehiclesSetup(newVehiclesSetup);
                sendVehicleSetupToServer(
                  newVehiclesSetup[vehicleSettings.vehicleType]
                );
              }}
              user={props.user}
            />
          )}
        </Grid>
        <Grid item xs={12}>
          <CollabsibleCard header="More vehicle settings">
            <Grid container spacing={1}>
              <Grid item xs={6} sm={6}>
                {props.resetOrientation && (
                  <BackdropButton onClick={props.resetOrientation}>
                    Reset orientation
                  </BackdropButton>
                )}
              </Grid>
              <Grid item xs={6} sm={6}>
                <BackdropButton
                  onClick={() => {
                    updateVehicleSettings(
                      "useChaseCamera",
                      !vehicleSettings.useChaseCamera
                    );
                  }}
                >
                  <>
                    Camera chaser{" "}
                    {vehicleSettings.useChaseCamera ? "On" : "Off"}
                  </>
                </BackdropButton>
              </Grid>

              <Grid item xs={12}>
                <Collapse in={vehicleSettings.useChaseCamera}>
                  <MySlider
                    color="black"
                    label="Chase camera speed"
                    min={0.05}
                    max={1}
                    step={0.01}
                    value={vehicleSettings.chaseCameraSpeed}
                    startIcon={<span>-</span>}
                    endIcon={<span>+</span>}
                    onChange={(value) => {
                      updateVehicleSettings(
                        "chaseCameraSpeed",
                        value as number,
                        true
                      );
                    }}
                    onChangeCommitted={(value) => {
                      updateVehicleSettings(
                        "chaseCameraSpeed",
                        value as number
                      );
                    }}
                  />
                </Collapse>
              </Grid>

              <Grid item xs={12}>
                <MySlider
                  label="Steering sensitivity"
                  color={color}
                  min={0.1}
                  max={1}
                  //      valueLabelDisplay="auto"
                  step={0.01}
                  value={vehicleSettings.steeringSensitivity}
                  onChange={(value) => {
                    updateVehicleSettings(
                      "steeringSensitivity",
                      value as number,
                      true
                    );
                  }}
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
                  value={vehicleSettings.cameraZoom}
                  onChange={(value) => {
                    updateVehicleSettings("cameraZoom", value as number, true);
                  }}
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
                  step={0.5}
                  value={vehicleSettings.noSteerNumber}
                  onChange={(value) => {
                    updateVehicleSettings(
                      "noSteerNumber",
                      value as number,
                      true
                    );
                  }}
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
                  checked={vehicleSettings.useDynamicFOV}
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
