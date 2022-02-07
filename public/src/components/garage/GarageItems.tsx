import { Label } from "@mui/icons-material";
import Grid from "@mui/material/Grid";
import React from "react";
import { VehicleType } from "../../shared-backend/shared-stuff";
import {
  getVehicleItemNameFromType,
  ItemProperties,
  ItemType,
  possibleVehicleItemTypes,
  vehicleItems,
  VehicleSetup,
} from "../../shared-backend/vehicleItems";
import MyTabs from "../tabs/MyTabs";
import GarageItem from "./GarageItem";

interface IGarageItems {
  vehicleType: VehicleType;
  onChange: (newItem: ItemProperties) => void;
  vehicleSetup: VehicleSetup;
}

const GarageItems = (props: IGarageItems) => {
  const items = vehicleItems[props.vehicleType];

  const isSelected = (item: ItemProperties) => {
    for (let itemType of possibleVehicleItemTypes) {
      if (item.type === itemType) {
        return props.vehicleSetup?.[itemType]?.name === item.name;
      }
    }
    return false;
  };

  const keys = Object.keys(items);

  const renderItemsFromType = (itemType: ItemType) => {
    const filteredKeys = keys.filter((k) => {
      return items[k].type === itemType;
    });

    return (
      <Grid container spacing={3} style={{ marginTop: 10 }}>
        {filteredKeys.map((key) => {
          const item = items[key];
          return (
            <Grid key={key} item xs={12} md={6} lg={4}>
              <GarageItem
                label={`${item.name} the ${item.type}`}
                onClick={() => {
                  props.onChange(item);
                }}
                thumbnail={<div></div>}
                selected={isSelected(item)}
              />
            </Grid>
          );
        })}
      </Grid>
    );
  };

  return (
    <MyTabs
      subtabs
      tabs={possibleVehicleItemTypes.map((itemType) => {
        return {
          label: getVehicleItemNameFromType(itemType),
          renderElement: () => renderItemsFromType(itemType),
        };
      })}
    />
  );
};

export default GarageItems;
