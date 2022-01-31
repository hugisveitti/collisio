import Grid from "@mui/material/Grid";
import React from "react";
import GarageItem from "./GarageItem";

interface IGarageItems {}

const GarageItems = (props: IGarageItems) => {
  const items = ["no items"];

  return (
    <Grid container spacing={3} style={{ marginTop: 10 }}>
      {items.map((item) => {
        return (
          <Grid key={item} item xs={12} md={6} lg={4}>
            <GarageItem
              label={item}
              onClick={() => {}}
              //  selected={props.selected === v.type}
              thumbnail={<div>No thumbnail</div>}
            />
          </Grid>
        );
      })}
    </Grid>
  );
};

export default GarageItems;
