import React, { useEffect, useRef, useState } from "react";
import { Grid, IconButton } from "@mui/material";
import { makeStyles } from "@mui/styles";
import AppContainer from "../../containers/AppContainer";
import { createShowRoomCanvas } from "./showRoomCanvas";
import "../../styles/main.css";
import { containerBackgroundColor } from "../../providers/theme";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { VehicleType } from "../../shared-backend/shared-stuff";

const possibleVehcileTypes: VehicleType[] = [
  "f1",
  "tractor",
  "normal",
  "monsterTruck",
];

const useStyles = makeStyles({
  arrowContainer: {
    textAlign: "center",
  },
});

interface IShowRoom {}

const ShowRoomComponent = (props: IShowRoom) => {
  const canvasWrapperRef = useRef();
  const [chassisNum, setChassisNum] = useState(0);
  const [vehicleTypeNum, setVehicleTypeNum] = useState(0);

  const classes = useStyles();

  useEffect(() => {
    const renderer = createShowRoomCanvas(
      possibleVehcileTypes[
        Math.abs(vehicleTypeNum % possibleVehcileTypes.length)
      ],
      chassisNum
    );
    if (canvasWrapperRef.current && renderer) {
      // @ts-ignore
      while (canvasWrapperRef.current.children.length > 0) {
        // @ts-ignore
        canvasWrapperRef.current.removeChild(
          // @ts-ignore
          canvasWrapperRef.current.children[0]
        );
      }

      // @ts-ignore

      canvasWrapperRef.current.appendChild(renderer.domElement);
    }
  }, [chassisNum, vehicleTypeNum]);

  return (
    <AppContainer>
      <div
        style={{
          backgroundColor: containerBackgroundColor,
        }}
      >
        <Grid item xs={12}>
          <div ref={canvasWrapperRef}></div>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={3} />
          <Grid item xs={3} className={classes.arrowContainer}>
            <IconButton
              onClick={() => {
                setVehicleTypeNum(vehicleTypeNum - 1);
              }}
            >
              <ArrowBackIosNewIcon />
            </IconButton>
          </Grid>
          <Grid item xs={3} className={classes.arrowContainer}>
            <IconButton
              onClick={() => {
                setVehicleTypeNum(vehicleTypeNum + 1);
              }}
            >
              <ArrowForwardIosIcon />
            </IconButton>
          </Grid>
          <Grid item xs={3} />

          <Grid item xs={3} />

          <Grid item xs={3} className={classes.arrowContainer}>
            <IconButton
              onClick={() => {
                setChassisNum(chassisNum - 1);
              }}
            >
              <KeyboardArrowLeftIcon />
            </IconButton>
          </Grid>
          <Grid item xs={3} className={classes.arrowContainer}>
            <IconButton
              onClick={() => {
                setChassisNum(chassisNum + 1);
              }}
            >
              <KeyboardArrowRightIcon />
            </IconButton>
          </Grid>
          <Grid item xs={3} />
        </Grid>
      </div>
    </AppContainer>
  );
};

export default ShowRoomComponent;
