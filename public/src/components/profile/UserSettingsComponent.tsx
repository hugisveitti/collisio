import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Collapse from "@mui/material/Collapse";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { IUser, IUserSettings, IVehicleSettings } from "../../classes/User";
import {
  getDBUserSettings,
  setDBUserSettings,
} from "../../firebase/firestoreFunctions";

import { cardBackgroundColor } from "../../providers/theme";
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
