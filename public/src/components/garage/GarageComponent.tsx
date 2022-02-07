import { CircularProgress, Grid } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { setDBUserSettings } from "../../firebase/firestoreFunctions";
import {
  buyItem,
  getOwnership,
  getVehicleItemsOwnership,
} from "../../firebase/firestoreOwnershipFunctions";
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
import {
  defaultItemsOwnership,
  ItemProperties,
  possibleVehicleMods,
  VehicleSetup,
} from "../../shared-backend/vehicleItems";
import { getVehicleNameFromType } from "../../vehicles/VehicleConfigs";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import { IStore } from "../store";
import MyTabs from "../tabs/MyTabs";
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
  onChangeVehicleItem?: (
    item: ItemProperties,
    vehicleType: VehicleType
  ) => void;
  onUnequipVehicleItem?: (item: ItemProperties) => void;
}

// to be saved on unmount
let _vehicleType: VehicleType;
let _vehicleColor: VehicleColorType;
let _vehicleSetup: VehicleSetup;

const GarageComponent = (props: IGarageComponent) => {
  const user = useContext(UserContext);
  const [selectedTab, setSelectedTab] = useState(0);

  const [selectedVehicleType, setSelectedVehicleType] = useState(
    props.store.userSettings.vehicleSettings.vehicleType
  );

  const [selectedVehicleColor, setSelectedVehicleColor] = useState(
    props.store.userSettings.vehicleSettings.vehicleColor
  );

  console.log(
    "selected vehicle setup",
    props.store.vehiclesSetup[
      props.store.userSettings.vehicleSettings.vehicleType
    ]
  );
  const [selectedVehicleSetup, setSelectedVehicleSetup] = useState(
    props.store.vehiclesSetup[
      props.store.userSettings.vehicleSettings.vehicleType
    ]
  );

  const [selectedItem, setSelectedItem] = useState(
    undefined as undefined | ItemProperties
  );

  const [ownership, setOwnership] = useState(
    undefined as undefined | AllOwnership
  );

  const [itemOwnership, setItemOwnership] = useState(defaultItemsOwnership);

  const [isBuying, setIsBuying] = useState(false);

  useEffect(() => {
    return () => {
      console.log("on unmount", _vehicleSetup, _vehicleType, _vehicleColor);
    };
  }, []);

  useEffect(() => {
    if (user?.uid) {
      getOwnership(user.uid)
        .then((_ownership) => {
          setOwnership(_ownership);
        })
        .catch(() => {
          toast.error("Error getting ownership");
        });
      console.log("selectedVehicleType", selectedVehicleType);
      getVehicleItemsOwnership(user.uid, selectedVehicleType).then(
        (_ownership) => {
          const newItemOwnership = { ...itemOwnership };
          newItemOwnership[selectedVehicleType] = _ownership;
          setItemOwnership(newItemOwnership);
        }
      );
    }
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;
    // no need to call again
    if (itemOwnership[selectedVehicleType]) return;
    getVehicleItemsOwnership(user.uid, selectedVehicleType).then(
      (_ownership) => {
        const newItemOwnership = { ...itemOwnership };
        newItemOwnership[selectedVehicleType] = _ownership;
        setItemOwnership(newItemOwnership);
      }
    );
  }, [selectedVehicleType]);

  const handleChangeVehicle = (
    value: any,
    key: "vehicleType" | "vehicleColor"
  ) => {
    if (key === "vehicleColor") {
      setSelectedVehicleColor(value);
    } else if (key === "vehicleType") {
      setSelectedVehicleType(value);
      setSelectedVehicleSetup(props.store.vehiclesSetup[value]);
    }

    if (ownership && ownership[value]) {
      if (key === "vehicleColor") {
        _vehicleColor = value as VehicleColorType;
        props.onChangeVehicleColor?.(value);
      } else if (key === "vehicleType") {
        _vehicleType = value as VehicleType;
        props.onChangeVehicleType?.(value);
      }
    }
  };

  const handleChangeVehicleItem = (item: ItemProperties) => {
    const newSetup: VehicleSetup = {
      ...selectedVehicleSetup,
    };
    newSetup[item.type] = item;
    _vehicleSetup = newSetup;

    setSelectedVehicleSetup(newSetup);
    setSelectedItem(item);
    if (itemOwnership[selectedVehicleType][item.path]) {
      props.onChangeVehicleItem?.(item, selectedVehicleType);
    }
  };

  const handleUnequipItem = (item: ItemProperties) => {
    const newSetup: VehicleSetup = {
      ...selectedVehicleSetup,
    };
    newSetup[item.type] = undefined;
    _vehicleSetup = newSetup;

    setSelectedVehicleSetup(newSetup);
    setSelectedItem(undefined);
    if (itemOwnership[selectedVehicleType][item.path]) {
      props.onUnequipVehicleItem?.(item);
    }
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

  const handleBuyVehicleItem = (
    item: ItemProperties,
    vehicleType: VehicleType
  ) => {
    setIsBuying(true);
    buyItem(user.uid, item.path, vehicleType).then((data) => {
      console.log("data from buy item", data);
      if (data.completed) {
        toast.success(data.message);

        const newItemOwnership = {
          ...itemOwnership,
        };
        newItemOwnership[vehicleType][item.path] = true;
        setItemOwnership(newItemOwnership);

        const newTokenData: ITokenData = {
          ...props.store.tokenData,
          coins: props.store.tokenData.coins - item.cost,
        };
        props.store.setTokenData(newTokenData);

        props.onChangeVehicleItem?.(item, vehicleType);
      } else {
        toast.error(data.message);
      }
      console.log("set is buying to false");
      setIsBuying(false);
    });
  };

  // useEffect(() => {
  //   return () => {
  //     if (user?.uid) {
  //       // save on unmount?
  //       //   setDBUserSettings(user?.uid, props.store.userSettings);
  //     }
  //   };
  // }, [user]);

  const renderOwnershipComponent = () => {
    if (!user) {
      return <span>Only logged in players can buy items.</span>;
    }
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
      if (!selectedItem) {
        return <div className="background">No item selected</div>;
      }

      return (
        <BuyItemComponent
          loading={isBuying}
          cost={selectedItem.cost}
          label={
            <div>
              <span>
                {selectedItem.name} the {selectedItem.type}
              </span>
              {possibleVehicleMods.map((p) => {
                if (selectedItem[p.type]) {
                  return (
                    <div key={p.type}>
                      {p.name}:{" "}
                      {selectedItem[p.type] > 0
                        ? `+${selectedItem[p.type]}`
                        : selectedItem[p.type]}
                    </div>
                  );
                }
              })}
            </div>
          }
          onUnequip={() => {
            handleUnequipItem(selectedItem);
          }}
          onBuy={() => {
            handleBuyVehicleItem(selectedItem, selectedVehicleType);
          }}
          owned={itemOwnership[selectedVehicleType]?.[selectedItem.path]}
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
              vehicleSetup={selectedVehicleSetup}
            />
          </Grid>
          <Grid item xs={12}>
            {renderOwnershipComponent()}
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12} sm={6} style={{}}>
        <MyTabs
          onTabChange={(newTab) => setSelectedTab(newTab)}
          tabs={[
            {
              label: "Cars",
              renderElement: () => (
                <GarageCars
                  selected={selectedVehicleType}
                  onChange={(v) => {
                    handleChangeVehicle(v, "vehicleType");
                    setSelectedItem(undefined);
                  }}
                />
              ),
            },
            {
              label: "Colors",
              renderElement: () => (
                <GarageColors
                  selected={selectedVehicleColor}
                  onChange={(color) => {
                    handleChangeVehicle(color, "vehicleColor");
                  }}
                />
              ),
            },
            {
              label: "Items",
              renderElement: () => {
                return (
                  <GarageItems
                    vehicleType={selectedVehicleType}
                    onChange={(item: ItemProperties) => {
                      handleChangeVehicleItem(item);
                    }}
                    vehicleSetup={selectedVehicleSetup}
                  />
                );
              },
            },
          ]}
        />
      </Grid>
    </Grid>
  );
};

export default GarageComponent;