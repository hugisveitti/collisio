import { Tab, Tabs, Box, Typography, Grid } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { IVehicleSettings } from "../../classes/User";
import { setDBUserSettings } from "../../firebase/firestoreFunctions";
import { getStyledColors } from "../../providers/theme";
import { UserContext } from "../../providers/UserProvider";
import { VehicleType } from "../../shared-backend/shared-stuff";
import BackdropContainer from "../backdrop/BackdropContainer";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import ShowRoomComponent from "../showRoom/ShowRoomComponent";
import { IStore } from "../store";
import GarageCars from "./GarageCars";
import GarageColors from "./GarageColors";
import GarageItems from "./GarageItems";
import GarageVehicle from "./GarageVehicle";

const a11yProps = (index: number) => {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

interface IGarageContainer {
  store: IStore;
}

const GarageContainer = (props: IGarageContainer) => {
  const user = useContext(UserContext);
  const [value, setValue] = useState(0);
  const [selectedVehicleType, setSelectedVehicleType] = useState(
    props.store.userSettings.vehicleSettings.vehicleType
  );

  const handleChangeVehicleType = (newVehicleType: VehicleType) => {
    const newVehicleSettings = {
      ...props.store.userSettings.vehicleSettings,
      vehicleType: newVehicleType,
    };
    const newUserSettings = {
      ...props.store.userSettings,
      vehicleSettings: newVehicleSettings,
    };
    props.store.setUserSettings(newUserSettings);
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const { color, backgroundColor } = getStyledColors("black");

  useEffect(() => {
    return () => {
      if (user?.uid) {
        // save on unmount?
        setDBUserSettings(user?.uid, props.store.userSettings);
      }
    };
  }, [user]);

  return (
    <BackdropContainer>
      <Grid container spacing={3} style={{ width: "95%", margin: "auto" }}>
        <Grid item xs={12}>
          <ToFrontPageButton color="black" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <GarageVehicle
            vehicleColor={props.store.userSettings.vehicleSettings.vehicleColor}
            vehicleType={props.store.userSettings.vehicleSettings.vehicleType}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <div style={{ width: "100%", color, backgroundColor, padding: 10 }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={value}
                onChange={handleChange}
                aria-label="basic tabs example"
              >
                <Tab label="Cars" {...a11yProps(0)} style={{ color }} />
                <Tab label="Color" {...a11yProps(1)} style={{ color }} />
                <Tab label="Items" {...a11yProps(2)} style={{ color }} />
              </Tabs>
            </Box>
            {value === 0 && (
              <GarageCars
                selected={props.store.userSettings.vehicleSettings.vehicleType}
                onChange={(v) => {
                  handleChangeVehicleType(v);
                }}
              />
            )}

            {value === 1 && (
              <GarageColors
                selected={props.store.userSettings.vehicleSettings.vehicleColor}
                onChange={(color) => {
                  const newVehicleSettings: IVehicleSettings = {
                    ...props.store.userSettings.vehicleSettings,
                    vehicleColor: color,
                  };
                  const newUserSettings = {
                    ...props.store.userSettings,
                    vehicleSettings: newVehicleSettings,
                  };
                  console.log(
                    "vehicelsett",
                    props.store.userSettings.vehicleSettings
                  );
                  props.store.setUserSettings(newUserSettings);
                }}
              />
            )}
            {value === 2 && <GarageItems />}
          </div>
        </Grid>
      </Grid>
    </BackdropContainer>
  );
};

export default GarageContainer;
