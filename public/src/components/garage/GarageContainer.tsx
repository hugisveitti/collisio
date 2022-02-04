import React from "react";
import { setDBVehiclesSetup } from "../../firebase/firestoreOwnershipFunctions";
import {
  VehicleColorType,
  VehicleType,
} from "../../shared-backend/shared-stuff";
import { ItemProperties } from "../../shared-backend/vehicleItems";
import BackdropContainer from "../backdrop/BackdropContainer";
import { IStore } from "../store";
import GarageComponent from "./GarageComponent";

interface IGarageContainer {
  store: IStore;
}

const GarageContainer = (props: IGarageContainer) => {
  return (
    <BackdropContainer>
      <GarageComponent
        store={props.store}
        showBackButton
        onChangeVehicleType={(newVehicleType: VehicleType) => {}}
        onChangeVehicleColor={(newVehicleColor: VehicleColorType) => {}}
        onChangeVehicleItem={(item: ItemProperties) => {
          const newVehicleSetup = { ...props.store.vehiclesSetup };

          newVehicleSetup[props.store.userSettings.vehicleSettings.vehicleType][
            item.type
          ] = item;

          props.store.setVehiclesSetup(newVehicleSetup);
        }}
        onUnequipVehicleItem={() => {
          console.log("unequi on impl");
        }}
      />
    </BackdropContainer>
  );
};

export default GarageContainer;
