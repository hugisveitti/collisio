import CardHeader from "@mui/material/CardHeader";
import React, { useEffect, useState } from "react";
import { IUser } from "../../classes/User";
import { getDBUserSettings } from "../../firebase/firestoreFunctions";
import MyCard from "../card/MyCard";
import VehicleSettingsComponent from "../settings/VehicleSettingsComponent";
import { IStore } from "../store";

interface IUserSettingsComponent {
  user: IUser;
  store: IStore;
}

const UserSettingsComponent = (props: IUserSettingsComponent) => {
  const [inEditMode, setInEditMode] = useState(false);

  useEffect(() => {
    getDBUserSettings(props.user?.uid).then((settings) => {
      props.store.setUserSettings(settings);
    });
  }, []);

  const renderStaticInfo = () => {
    if (!props.store.userSettings?.vehicleSettings?.vehicleType) return null;
    return (
      <>
        <CardHeader
          title="User settings"
          subheader="Most of these are also editable in-game"
        />
        <VehicleSettingsComponent
          linkToGarage
          store={props.store}
          user={props.user}
          previewVehicle
        />
      </>
    );
  };

  if (!props.store.userSettings) return null;

  return <MyCard>{renderStaticInfo()}</MyCard>;
};

export default UserSettingsComponent;
