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
import { IUserSettings, IVehicleSettings } from "../../classes/User";
import {
  getDBUserSettings,
  setDBUserSettings,
} from "../../firebase/firestoreFunctions";

import { cardBackgroundColor } from "../../providers/theme";

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

  const [steerSenceDefaultVal, setSteerSenceDefaultVal] = useState(0.3);

  useEffect(() => {
    getDBUserSettings(props.userId, (settings) => {
      setUserSettings(settings);

      setVehicleSettings(settings.vehicleSettings);
      setSteerSenceDefaultVal(settings.vehicleSettings.steeringSensitivity);
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
                <Typography>Steering sensitivity</Typography>
                <Slider
                  min={0.01}
                  max={2}
                  valueLabelDisplay="auto"
                  step={0.01}
                  value={steerSenceDefaultVal}
                  onChange={(e, value) => {
                    setSteerSenceDefaultVal(value as number);
                  }}
                  onChangeCommitted={(e, value) => {
                    updateVehicleSettings(
                      "steeringSensitivity",
                      steerSenceDefaultVal
                    );
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
      variant="outlined"
      style={{
        backgroundColor: cardBackgroundColor,
      }}
    >
      {renderStaticInfo()}
    </Card>
  );
};

export default UserSettingsComponent;
