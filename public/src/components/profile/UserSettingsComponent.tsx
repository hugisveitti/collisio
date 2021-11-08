import {
  Grid,
  CardHeader,
  IconButton,
  Card,
  CardContent,
  Collapse,
  CardActions,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EditOffIcon from "@mui/icons-material/EditOff";
import {
  getDBUserSettings,
  setDBUserSettings,
} from "../../firebase/firebaseFunctions";
import { inputBackgroundColor } from "../../providers/theme";
import { IUserSettings, IVehicleSettings } from "../../classes/User";
import VehicleSelect from "../inputs/VehicleSelect";

interface IUserSettingsComponent {
  userId: string;
}

const UserSettingsComponent = (props: IUserSettingsComponent) => {
  const [inEditMode, setInEditMode] = useState(false);
  const [userSettings, setUserSettings] = useState({} as IUserSettings);
  const [vehicleSettings, setVehicleSettings] = useState(
    {} as IVehicleSettings
  );
  const [vehicleOpen, setVehicleOpen] = useState(false);

  useEffect(() => {
    getDBUserSettings(props.userId, (settings) => {
      console.log("settings", settings);
      setUserSettings(settings);

      setVehicleSettings(settings.vehicleSettings);
    });
  }, []);

  const updateVehicleSettings = (key: keyof IVehicleSettings, value: any) => {
    const newVehicleSettings = vehicleSettings;
    // @ts-ignore
    newVehicleSettings[key] = value;
    setVehicleSettings(newVehicleSettings);
    const newUserSettings = {
      ...userSettings,
      vehicleSettings: newVehicleSettings,
    };
    setUserSettings(newUserSettings);
    setDBUserSettings(props.userId, newUserSettings);
  };

  const renderStaticInfo = () => {
    if (!vehicleSettings?.vehicleType) return null;
    return (
      <>
        <CardHeader
          title="User settings"
          subheader="Most of these are also editable in-game"
        />
        <CardActions>
          <IconButton onClick={() => setVehicleOpen(!vehicleOpen)}>
            {vehicleOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </CardActions>
        <Collapse in={vehicleOpen}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <VehicleSelect
                  value={vehicleSettings.vehicleType}
                  onChange={(vt) => {
                    updateVehicleSettings("vehicleType", vt);
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Collapse>
      </>
    );
  };

  if (!userSettings) return null;

  return (
    <Card
      style={{
        backgroundColor: inputBackgroundColor,
      }}
    >
      {renderStaticInfo()}
    </Card>
  );
};

export default UserSettingsComponent;
