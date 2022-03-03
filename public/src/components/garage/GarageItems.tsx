import Grid from "@mui/material/Grid";
import React, { useState } from "react";
import { VehicleType } from "../../shared-backend/shared-stuff";
import {
  getVehicleItemNameFromType,
  ItemProperties,
  ItemType,
  possibleVehicleItemTypes,
  possibleVehicleMods,
  vehicleItems,
  VehicleSetup,
} from "../../shared-backend/vehicleItems";
import { getSizeAbbr } from "../../utils/utilFunctions";
import MyTabs from "../tabs/MyTabs";
import GarageItem from "./GarageItem";

interface IGarageItems {
  vehicleType: VehicleType;
  onChange: (newItem: ItemProperties) => void;
  vehicleSetup: VehicleSetup;
  ownership: { [key: string]: boolean };
  loggedIn: boolean;
}

const GarageItems = (props: IGarageItems) => {
  const [selectedItemType, setSelectedItemType] = useState(
    "exhaust" as ItemType
  );
  const items = vehicleItems[props.vehicleType];

  const isSelected = (item: ItemProperties) => {
    return props.vehicleSetup?.[selectedItemType]?.id === item.id;
  };

  const keys = Object.keys(items);

  const renderItemsFromType = (itemType: ItemType) => {
    const filteredKeys = keys.filter((k) => {
      return items[k].type === itemType;
    });

    return (
      <Grid container spacing={1} style={{ marginTop: 10 }}>
        {filteredKeys.map((key) => {
          const item = items[key];
          return (
            <Grid key={key} item xs={12} md={6} lg={4}>
              <GarageItem
                style={{
                  height: 100,
                  paddingTop: 7,
                }}
                owned={props.ownership?.[item.path]}
                label={
                  <div style={{ marginTop: 5 }}>
                    {item.name} the {item.type}
                  </div>
                }
                onClick={() => {
                  props.onChange(item);
                }}
                thumbnail={
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        fontStyle: "bold",
                        fontSize: 10,
                      }}
                    >
                      <span>Coins {getSizeAbbr(item.cost)}</span>
                    </div>
                    {possibleVehicleMods.map((p) => {
                      if (item[p.type]) {
                        return (
                          <div
                            key={`${key}-${p.type}`}
                            style={{
                              fontSize: 8,
                            }}
                          >
                            {p.name}:{" "}
                            {item[p.type] > 0
                              ? `+${item[p.type]}`
                              : item[p.type]}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                }
                selected={isSelected(item)}
                loggedIn={props.loggedIn}
              />
            </Grid>
          );
        })}
      </Grid>
    );
  };

  return (
    <MyTabs
      id="vehicle-items"
      subtabs
      tabs={possibleVehicleItemTypes.map((itemType) => {
        return {
          label: getVehicleItemNameFromType(itemType),
          renderElement: () => renderItemsFromType(itemType),
        };
      })}
      onTabChange={(i) => {
        setSelectedItemType(possibleVehicleItemTypes[i]);
      }}
    />
  );
};

export default GarageItems;
