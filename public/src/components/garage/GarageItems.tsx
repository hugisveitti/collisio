import Grid from "@mui/material/Grid";
import React from "react";
import { VehicleType } from "../../shared-backend/shared-stuff";
import {
  ItemProperties,
  vehicleItems,
} from "../../shared-backend/vehicleItems";
import GarageItem from "./GarageItem";

interface IGarageItems {
  vehicleType: VehicleType;
  onChange: (newItem: ItemProperties) => void;
}

const GarageItems = (props: IGarageItems) => {
  const items = vehicleItems[props.vehicleType];

  const keys = Object.keys(items);
  return (
    <Grid container spacing={3} style={{ marginTop: 10 }}>
      {keys.map((key) => {
        const item = items[key];
        return (
          <Grid key={key} item xs={12} md={6} lg={4}>
            <GarageItem
              label={`${item.name} the ${item.type}`}
              onClick={() => {
                props.onChange(item);
              }}
              //  selected={props.selected === v.type}
              thumbnail={<div></div>}
            />
          </Grid>
        );
      })}
    </Grid>
  );
};

export default GarageItems;
