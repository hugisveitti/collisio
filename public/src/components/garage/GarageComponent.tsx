import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import { height } from "@mui/material/node_modules/@mui/system";
import React, { useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
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
  defaultVehicleColorType,
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
import { getDeviceType } from "../../utils/settings";
import { getVehicleNameFromType } from "../../vehicles/VehicleConfigs";
import BackdropButton from "../button/BackdropButton";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import { loginPagePath } from "../Routes";
import { setRendererHeight } from "../showRoom/showRoomCanvas";
import { IStore } from "../store";
import MyTabs from "../tabs/MyTabs";
import TokenComponent from "../tokenComponent/TokenComponent";
import BuyItemComponent from "./BuyItemComponent";
import GarageCars from "./GarageCars";
import GarageColors from "./GarageColors";
import GarageItems from "./GarageItems";
import GarageVehicle from "./GarageVehicle";
import VehicleStatsComponent from "./VehicleStatsComponent";

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
  saveSetup?: () => void;
  disableInputs?: boolean;
  onUnequipAllItems?: () => void;
}

// to be saved on unmount
let _vehicleType: VehicleType;
let _vehicleColor: VehicleColorType;
let _vehicleSetup: VehicleSetup;

let originalTop = 0;
let firstScroll = false;
let box = { height: 0 };

function getScrollParent(node) {
  if (node == null) {
    return null;
  }

  if (node.scrollHeight > node.clientHeight) {
    return node;
  } else {
    return getScrollParent(node.parentNode);
  }
}

let scrollParent: HTMLElement | Window;

const GarageComponent = (props: IGarageComponent) => {
  const onMobile = getDeviceType() === "mobile";
  const user = useContext(UserContext);
  const [selectedTab, setSelectedTab] = useState(0);

  const [selectedVehicleType, setSelectedVehicleType] = useState(
    props.store.userSettings.vehicleSettings.vehicleType
  );

  const [selectedVehicleSetup, setSelectedVehicleSetup] = useState(
    props.store.vehiclesSetup?.[
      props.store.userSettings.vehicleSettings.vehicleType
    ] ?? {
      vehicleType: props.store.userSettings.vehicleSettings.vehicleType,
      vehicleColor: defaultVehicleColorType,
    }
  );

  const [selectedVehicleColor, setSelectedVehicleColor] = useState(
    selectedVehicleSetup?.vehicleColor ?? defaultVehicleColorType
  );

  const [selectedItem, setSelectedItem] = useState(
    undefined as undefined | ItemProperties
  );

  const [ownership, setOwnership] = useState(
    undefined as undefined | AllOwnership
  );

  const stickyDivRef = useRef<HTMLDivElement>();
  const garageRef = useRef<HTMLDivElement>();

  const [itemOwnership, setItemOwnership] = useState(defaultItemsOwnership);

  const [isBuying, setIsBuying] = useState(false);
  const [vehicleRef, setVehicleRef] = useState(
    undefined as undefined | React.MutableRefObject<HTMLDivElement>
  );

  const handleScrolling = () => {
    // only scrolling on mobile

    if (!onMobile) return;
    const originalHeight = box.height;

    // hacky, was happening because some items were still loading
    if (!firstScroll) {
      firstScroll = true;
      originalTop = stickyDivRef.current.offsetTop;
    }

    if (!scrollParent) {
      console.warn("No scrollparent");
      return;
    }

    const parentHeight =
      scrollParent instanceof HTMLElement
        ? scrollParent.getBoundingClientRect().height
        : window.innerHeight;

    const scrollY =
      scrollParent instanceof HTMLElement
        ? scrollParent.scrollTop
        : scrollParent.scrollY;
    if (scrollY > originalTop) {
      // if over then make renderer smaller

      // if over so much that the renderer cant be seen, move the div
      // as long as the garage is in frame

      if (
        scrollY > parentHeight - originalTop &&
        scrollY <
          garageRef.current.offsetTop +
            garageRef.current.clientHeight -
            box.height
      ) {
        stickyDivRef.current.setAttribute(
          "style",
          `
          position:relative;
          top:${scrollY - originalTop}px;
          max-width:100%;
          z-index:1000;
        `
        );
      } else {
        stickyDivRef.current.setAttribute(
          "style",
          `
        position:static;
        z-index:1000;
       `
        );
      }
    } else if (
      scrollY >
      garageRef.current.offsetTop + garageRef.current.clientHeight
    ) {
    } else {
      stickyDivRef.current.setAttribute(
        "style",
        `
        position:static;
        z-index:1000;
       `
      );
      originalTop = stickyDivRef.current.offsetTop;
    }
  };

  useEffect(() => {
    if (vehicleRef && stickyDivRef) {
      const top = stickyDivRef.current.offsetTop;
      originalTop = top;
      box = vehicleRef.current.getBoundingClientRect();

      scrollParent = getScrollParent(garageRef.current) ?? window;
      if ((scrollParent as HTMLElement)?.tagName === "HTML") {
        scrollParent = window;
      }

      scrollParent.addEventListener("scroll", handleScrolling);
    }
    return () => {
      if (scrollParent) {
        scrollParent.removeEventListener("scroll", handleScrolling);
      }
    };
  }, [vehicleRef, stickyDivRef]);

  useEffect(() => {
    if (user?.uid) {
      getOwnership(user.uid)
        .then((_ownership) => {
          setOwnership(_ownership);
        })
        .catch(() => {
          console.warn("Error getting ownership");
        });
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

  const handleChangeVehicle = (value: any) => {
    setSelectedVehicleType(value);

    setSelectedVehicleSetup(
      props.store.vehiclesSetup?.[value] ?? {
        vehicleType: value,
        vehicleColor: defaultVehicleColorType,
      }
    );

    if (ownership && ownership[value]) {
      _vehicleType = value as VehicleType;
      props.onChangeVehicleType?.(value);
    }
  };

  const handleChangeVehicleColor = (color: VehicleColorType) => {
    setSelectedVehicleColor(color);
    setSelectedVehicleSetup({
      ...selectedVehicleSetup,
      vehicleColor: color,
    });
    if (ownership && ownership[color]) {
      props.onChangeVehicleColor?.(color);
    }
  };

  const handleChangeVehicleItem = (item: ItemProperties) => {
    const newSetup: VehicleSetup = {
      ...selectedVehicleSetup,
    };
    if (selectedVehicleSetup[item.type]?.id === item.id) {
      handleUnequipItem(item);
      return;
    }
    newSetup[item.type] = item;
    _vehicleSetup = newSetup;

    setSelectedVehicleSetup(newSetup);
    setSelectedItem(item);
    if (itemOwnership[selectedVehicleType]?.[item.path]) {
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
    //  if (itemOwnership[selectedVehicleType][item.path]) {
    props.onUnequipVehicleItem?.(item);
    //   }
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
      setIsBuying(false);
    });
  };

  const renderOwnershipComponent = () => {
    if (!user) {
      return (
        <div className="background">
          <span>Only logged in players can buy items.</span>
          <BackdropButton link={loginPagePath} color="white">
            Login
          </BackdropButton>
        </div>
      );
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
          notAfford={
            allCosts[selectedVehicleType] > props.store.tokenData?.coins
          }
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
          notAfford={
            allCosts[selectedVehicleColor] > props.store.tokenData?.coins
          }
        />
      );
    }
    if (selectedTab === 2) {
      if (!selectedItem) {
        return (
          <div className="background">
            <BackdropButton
              onClick={() => {
                props.onUnequipAllItems?.();
                setSelectedVehicleSetup({
                  vehicleType: selectedVehicleType,
                  vehicleColor: selectedVehicleColor,
                });
                setSelectedItem(undefined);
              }}
              disabled={Object.keys(selectedVehicleSetup).length === 1}
            >
              Unequip all items
            </BackdropButton>
          </div>
        );
      }

      return (
        <BuyItemComponent
          notAfford={selectedItem.cost > props.store.tokenData?.coins}
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
    <Grid container spacing={3} style={{}} ref={garageRef}>
      {props.showBackButton && (
        <>
          <Grid item xs={6}>
            <ToFrontPageButton color="black" />
          </Grid>
          <Grid item xs={6}>
            <BackdropButton
              disabled={props.disableInputs}
              style={{ float: "right" }}
              onClick={() => {
                props.saveSetup?.();
              }}
            >
              Save setup
            </BackdropButton>
          </Grid>
        </>
      )}
      <Grid item xs={12} sm={6} lg={7} style={{}}>
        <Grid container spacing={1} style={{}}>
          <Grid item xs={12} lg={5}>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <TokenComponent user={user} store={props.store} />
              </Grid>
              <Grid item xs={12}>
                <VehicleStatsComponent
                  vehicleSetup={selectedVehicleSetup}
                  vehicleType={selectedVehicleType}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} lg={7} ref={stickyDivRef}>
            <GarageVehicle
              setRef={(ref) => setVehicleRef(ref)}
              vehicleColor={selectedVehicleColor}
              vehicleType={selectedVehicleType}
              vehicleSetup={selectedVehicleSetup}
            />
            <br />
            {renderOwnershipComponent()}
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12} sm={6} lg={5} style={{}}>
        <MyTabs
          onTabChange={(newTab) => setSelectedTab(newTab)}
          tabs={[
            {
              label: "Cars",
              renderElement: () => (
                <GarageCars
                  loggedIn={!!user}
                  ownership={ownership}
                  selected={selectedVehicleType}
                  onChange={(v) => {
                    handleChangeVehicle(v);
                    setSelectedItem(undefined);
                  }}
                />
              ),
            },
            {
              label: "Colors",
              renderElement: () => (
                <GarageColors
                  loggedIn={!!user}
                  ownership={ownership}
                  selected={selectedVehicleColor}
                  onChange={(color) => {
                    handleChangeVehicleColor(color);
                  }}
                />
              ),
            },
            {
              label: "Items",
              renderElement: () => {
                return (
                  <GarageItems
                    loggedIn={!!user}
                    ownership={itemOwnership[selectedVehicleType]}
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
