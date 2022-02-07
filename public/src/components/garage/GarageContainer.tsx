import React, { useContext, useEffect } from "react";
import { setDBVehiclesSetup } from "../../firebase/firestoreOwnershipFunctions";
import { UserContext } from "../../providers/UserProvider";
import {
  VehicleColorType,
  VehicleType,
} from "../../shared-backend/shared-stuff";
import { ItemProperties } from "../../shared-backend/vehicleItems";
import { VehiclesSetup } from "../../vehicles/VehicleSetup";
import BackdropContainer from "../backdrop/BackdropContainer";
import { IStore } from "../store";
import GarageComponent from "./GarageComponent";

interface IGarageContainer {
  store: IStore;
}

let vehicleSetupToSave = undefined as undefined | VehiclesSetup;

const GarageContainer = (props: IGarageContainer) => {
  const user = useContext(UserContext);

  useEffect(() => {
    return () => {
      console.log("Unmoun garage container", vehicleSetupToSave);
      if (user?.uid) {
        setDBVehiclesSetup(user.uid, vehicleSetupToSave);
      }
    };
  }, []);

  useEffect(() => {
    console.log("store in use eff", props.store);
    vehicleSetupToSave = props.store.vehiclesSetup;
  }, [props.store.vehiclesSetup]);

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
