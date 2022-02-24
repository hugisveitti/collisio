import Grid from "@mui/material/Grid";
import React from "react";
import {
  vehicleColors,
  VehicleColorType,
} from "../../shared-backend/shared-stuff";
import GarageItem from "./GarageItem";

interface IGarageColors {
  onChange: (newColor: VehicleColorType) => void;
  selected: string;
  ownership: { [key: string]: boolean };
  loggedIn: boolean;
}

const GarageColors = (props: IGarageColors) => {
  const items = ["no items"];

  return (
    <Grid container spacing={3} style={{ marginTop: 10 }}>
      {vehicleColors.map((color) => {
        return (
          <Grid key={color.name} item xs={12} md={6} lg={4}>
            <GarageItem
              loggedIn={props.loggedIn}
              owned={props.ownership?.[color.value]}
              label={color.name}
              onClick={() => {
                props.onChange(color.value);
              }}
              selected={props.selected === color.value}
              thumbnail={
                <div
                  style={{
                    width: "100%",
                    height: 50,
                    backgroundColor: color.value,
                  }}
                ></div>
              }
            />
          </Grid>
        );
      })}
    </Grid>
  );
};

export default GarageColors;
