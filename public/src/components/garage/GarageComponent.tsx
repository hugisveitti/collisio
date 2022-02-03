import { Box, CircularProgress, Grid, Tab, Tabs } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { setDBUserSettings } from "../../firebase/firestoreFunctions";
import {
  buyItem,
  getOwnership,
} from "../../firebase/firestoreOwnershipFunctions";
import { getStyledColors } from "../../providers/theme";
import { UserContext } from "../../providers/UserProvider";
import { ITokenData } from "../../shared-backend/medalFuncions";
import {
  allCosts,
  AllOwnableItems,
  AllOwnership,
} from "../../shared-backend/ownershipFunctions";
import {
  getColorNameFromType,
  VehicleColorType,
  VehicleType,
} from "../../shared-backend/shared-stuff";
import { getVehicleNameFromType } from "../../vehicles/VehicleConfigs";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import { IStore } from "../store";
import TokenComponent from "../tokenComponent/TokenComponent";
import BuyItemComponent from "./BuyItemComponent";
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

interface IGarageComponent {
  store: IStore;
  showBackButton?: boolean;
  onChangeVehicleType?: (vehicleType: VehicleType) => void;
  onChangeVehicleColor?: (vehicleColor: VehicleColorType) => void;
}

const GarageComponent = (props: IGarageComponent) => {
  const user = useContext(UserContext);
  const [selectedTab, setSelectedTab] = useState(0);

  const [selectedVehicleType, setSelectedVehicleType] = useState(
    props.store.userSettings.vehicleSettings.vehicleType
  );

  const [selectedVehicleColor, setSelectedVehicleColor] = useState(
    props.store.userSettings.vehicleSettings.vehicleColor
  );

  const [ownership, setOwnership] = useState(
    undefined as undefined | AllOwnership
  );

  const [isBuying, setIsBuying] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      getOwnership(user.uid)
        .then((_ownership) => {
          setOwnership(_ownership);
        })
        .catch(() => {
          toast.error("Error getting ownership");
        });
    }
  }, [user]);

  const handleChangeVehicle = (
    value: any,
    key: "vehicleType" | "vehicleColor"
  ) => {
    if (key === "vehicleColor") {
      setSelectedVehicleColor(value);
    } else if (key === "vehicleType") {
      setSelectedVehicleType(value);
    }

    console.log("owner ship of ", value, ownership[value]);
    if (ownership[value]) {
      if (key === "vehicleColor") {
        props.onChangeVehicleColor?.(value);
      } else if (key === "vehicleType") {
        props.onChangeVehicleType?.(value);
      }
    }
  };

  const handleChange = (
    event: React.SyntheticEvent,
    newSelectedTab: number
  ) => {
    setSelectedTab(newSelectedTab);
  };

  const handleBuyItem = (
    item: AllOwnableItems,
    type: "vehicleType" | "vehicleColor"
  ) => {
    setIsBuying(true);
    buyItem(user.uid, item).then((data) => {
      if (data.completed) {
        toast.success(data.message);
        const newOwnership = {
          ...ownership,
        };
        newOwnership[item] = true;
        setOwnership(newOwnership);

        const newTokenData: ITokenData = {
          ...props.store.tokenData,
          coins: props.store.tokenData.coins - allCosts[item],
        };
        props.store.setTokenData(newTokenData);
        if (type === "vehicleColor") {
          props.onChangeVehicleColor(item as VehicleColorType);
        } else if (type === "vehicleType") {
          props.onChangeVehicleType(item as VehicleType);
        }
      } else {
        toast.error(data.message);
      }
      setIsBuying(false);
    });
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

  const renderOwnershipComponent = () => {
    if (!ownership) return <CircularProgress />;
    if (selectedTab === 0) {
      return (
        <BuyItemComponent
          loading={isBuying}
          cost={allCosts[selectedVehicleType]}
          label={getVehicleNameFromType(selectedVehicleType)}
          onBuy={() => {
            handleBuyItem(selectedVehicleType, "vehicleType");
          }}
          owned={ownership[selectedVehicleType]}
          buyButtonText="vehicle"
        />
      );
    }
    if (selectedTab === 1) {
      return (
        <BuyItemComponent
          loading={isBuying}
          cost={allCosts[selectedVehicleColor]}
          label={getColorNameFromType(selectedVehicleColor)}
          onBuy={() => {
            handleBuyItem(selectedVehicleColor, "vehicleColor");
          }}
          owned={ownership[selectedVehicleColor]}
          buyButtonText="color"
        />
      );
    }
    if (selectedTab === 2) {
      return (
        <BuyItemComponent
          loading={isBuying}
          cost={100}
          label={"item"}
          onBuy={() => {
            console.log("buying", "item");
          }}
          owned={false}
          buyButtonText="item"
        />
      );
    }
  };

  return (
    <Grid container spacing={3} style={{}}>
      {props.showBackButton && (
        <Grid item xs={12}>
          <ToFrontPageButton color="black" />
        </Grid>
      )}
      <Grid item xs={12} sm={6} style={{}}>
        <Grid container spacing={1} style={{}}>
          <Grid item xs={12}>
            <TokenComponent user={user} store={props.store} />
          </Grid>
          <Grid item xs={12}>
            <GarageVehicle
              vehicleColor={selectedVehicleColor}
              vehicleType={selectedVehicleType}
            />
          </Grid>
          <Grid item xs={12}>
            {renderOwnershipComponent()}
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12} sm={6} style={{}}>
        <div style={{ color, backgroundColor, padding: 10 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={selectedTab}
              onChange={handleChange}
              aria-label="basic tabs example"
            >
              <Tab label="Cars" {...a11yProps(0)} style={{ color }} />
              <Tab label="Color" {...a11yProps(1)} style={{ color }} />
              <Tab label="Items" {...a11yProps(2)} style={{ color }} />
            </Tabs>
          </Box>
          {selectedTab === 0 && (
            <GarageCars
              selected={selectedVehicleType}
              onChange={(v) => {
                handleChangeVehicle(v, "vehicleType");
              }}
            />
          )}

          {selectedTab === 1 && (
            <GarageColors
              selected={selectedVehicleColor}
              onChange={(color) => {
                handleChangeVehicle(color, "vehicleColor");
              }}
            />
          )}
          {selectedTab === 2 && <GarageItems />}
        </div>
      </Grid>
    </Grid>
  );
};

export default GarageComponent;
