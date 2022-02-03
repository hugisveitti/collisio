import React from "react";
import BackdropContainer from "../backdrop/BackdropContainer";
import { IStore } from "../store";
import GarageComponent from "./GarageComponent";

interface IGarageContainer {
  store: IStore;
}

const GarageContainer = (props: IGarageContainer) => {
  return (
    <BackdropContainer>
      <GarageComponent store={props.store} showBackButton />
    </BackdropContainer>
  );
};

export default GarageContainer;
