import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { IUserSettings, IVehicleSettings } from "../../classes/User";
import { setDBUserSettings } from "../../firebase/firestoreFunctions";
import { setDBVehiclesSetup } from "../../firebase/firestoreOwnershipFunctions";
import { UserContext } from "../../providers/UserProvider";
import {
  VehicleColorType,
  VehicleType,
} from "../../shared-backend/shared-stuff";
import {
  ItemProperties,
  possibleVehicleItemTypes,
} from "../../shared-backend/vehicleItems";
import { VehiclesSetup } from "../../vehicles/VehicleSetup";
import BackdropContainer from "../backdrop/BackdropContainer";
import { IStore } from "../store";
import GarageComponent from "./GarageComponent";

interface IGarageContainer {
  store: IStore;
}

let vehicleSetupToSave = undefined as undefined | VehiclesSetup;
let vehicleTypeToSave = undefined as undefined | VehicleType;
let vehicleColorToSave = undefined as undefined | VehicleColorType;

const GarageContainer = (props: IGarageContainer) => {
  const user = useContext(UserContext);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (user?.uid) {
        setDBVehiclesSetup(user.uid, vehicleSetupToSave);

        const newVehicleSettings: IVehicleSettings = {
          ...props.store.userSettings.vehicleSettings,
        };
        if (vehicleTypeToSave) {
          newVehicleSettings.vehicleType = vehicleTypeToSave;
        }
        if (vehicleColorToSave) {
          newVehicleSettings.vehicleColor = vehicleColorToSave;
        }

        if (vehicleColorToSave || vehicleTypeToSave) {
          const newUserSettings: IUserSettings = {
            ...props.store.userSettings,
            vehicleSettings: newVehicleSettings,
          };
          props.store.setUserSettings(newUserSettings);
          setDBUserSettings(user.uid, newUserSettings);
        }
      }
    };
  }, []);

  useEffect(() => {
    vehicleSetupToSave = props.store.vehiclesSetup;
  }, [props.store.vehiclesSetup]);

  return (
    <BackdropContainer>
      <GarageComponent
        store={props.store}
        showBackButton
        onChangeVehicleType={(newVehicleType: VehicleType) => {
          vehicleTypeToSave = newVehicleType;
          const newVehicleSettings: IVehicleSettings = {
            ...props.store.userSettings.vehicleSettings,
            vehicleType: newVehicleType,
          };
          const newUserSettings: IUserSettings = {
            ...props.store.userSettings,
            vehicleSettings: newVehicleSettings,
          };
          props.store.setUserSettings(newUserSettings);
        }}
        onChangeVehicleColor={(newVehicleColor: VehicleColorType) => {
          vehicleColorToSave = newVehicleColor;
          const newVehicleSettings: IVehicleSettings = {
            ...props.store.userSettings.vehicleSettings,
            vehicleColor: newVehicleColor,
          };
          const newUserSettings: IUserSettings = {
            ...props.store.userSettings,
            vehicleSettings: newVehicleSettings,
          };
          props.store.setUserSettings(newUserSettings);
        }}
        onChangeVehicleItem={(item: ItemProperties) => {
          const newVehicleSetup = { ...props.store.vehiclesSetup };

          newVehicleSetup[props.store.userSettings.vehicleSettings.vehicleType][
            item.type
          ] = item;

          props.store.setVehiclesSetup(newVehicleSetup);
        }}
        onUnequipVehicleItem={(item: ItemProperties) => {
          if (!user) return;
          const newVehiclesSetup = { ...props.store.vehiclesSetup };
          delete newVehiclesSetup[
            props.store.userSettings.vehicleSettings.vehicleType
          ][item.type];

          props.store.setVehiclesSetup(newVehiclesSetup);
        }}
        onUnequipAllItems={() => {
          if (!user) return;
          const newVehicleSetup = { ...props.store.vehiclesSetup };

          for (let item of possibleVehicleItemTypes) {
            delete newVehicleSetup[
              props.store.userSettings.vehicleSettings.vehicleType
            ][item];
          }
          props.store.setVehiclesSetup(newVehicleSetup);
        }}
        saveSetup={() => {
          setIsSaving(true);
          setDBVehiclesSetup(user.uid, props.store.vehiclesSetup)
            .then(() => {
              setIsSaving(false);
              toast.success("Vehicle setup saved");
            })
            .catch(() => {
              toast.error("Error saving vehicle setup");
            });

          setDBUserSettings(user.uid, props.store.userSettings);
        }}
        disableInputs={isSaving}
      />
    </BackdropContainer>
  );
};

export default GarageContainer;
