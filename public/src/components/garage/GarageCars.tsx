import Grid from "@mui/material/Grid";
import React from "react";
import f1Img from "../../images/vehicleThumbnails/f1.PNG";
import futureImg from "../../images/vehicleThumbnails/future.PNG";
import gokartImg from "../../images/vehicleThumbnails/gokart.PNG";
import normal2Img from "../../images/vehicleThumbnails/normal2.PNG";
import offRoaderImg from "../../images/vehicleThumbnails/offRoader.PNG";
import simpleSphereImg from "../../images/vehicleThumbnails/simpleSphere.PNG";
import sportsCarImg from "../../images/vehicleThumbnails/sportsCar.PNG";
import tractorImg from "../../images/vehicleThumbnails/tractor.PNG";
import { VehicleType } from "../../shared-backend/shared-stuff";
import { activeVehicleTypes } from "../../vehicles/VehicleConfigs";
import GarageItem from "./GarageItem";

const imageMap: { [vehicleType: string]: any } = {
  f1: f1Img,
  normal2: normal2Img,
  tractor: tractorImg,
  future: futureImg,
  offRoader: offRoaderImg,
  sportsCar: sportsCarImg,
  gokart: gokartImg,
  simpleSphere: simpleSphereImg,
};

interface IGarageCars {
  onChange: (newVehicle: VehicleType) => void;
  selected: VehicleType;
  ownership: { [key: string]: boolean };
  loggedIn: boolean;
}

const GarageCars = (props: IGarageCars) => {
  return (
    <Grid container spacing={3} style={{ marginTop: 10 }}>
      {activeVehicleTypes.map((v) => {
        return (
          <Grid key={v.type} item xs={12} md={6} lg={6} xl={4}>
            <GarageItem
              loggedIn={props.loggedIn}
              owned={props.ownership?.[v.type]}
              label={v.name}
              onClick={() => props.onChange(v.type)}
              selected={props.selected === v.type}
              thumbnail={
                <img
                  src={imageMap[v.type]}
                  style={{
                    width: "auto",
                    maxHeight: 120,
                    margin: "auto",
                    display: "block",
                  }}
                />
              }
            />
          </Grid>
        );
      })}
    </Grid>
  );
};

export default GarageCars;
