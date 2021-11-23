import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { Button, Collapse, Grid, IconButton, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import React, { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router";
import { VehicleType } from "../../shared-backend/shared-stuff";
import "../../styles/main.css";
import { stringInArray } from "../../utils/utilFunctions";
import {
  allVehicleTypes,
  possibleVehicleColors,
} from "../../vehicles/VehicleConfigs";
import { buyPremiumPagePath } from "../Routes";
import { createShowRoomCanvas, removeShowRoomCanvas } from "./showRoomCanvas";

// const allPossibleVehcileTypes: VehicleType[] = ["f1", "tractor", "normal", "truck", ];

const useStyles = makeStyles({
  arrowContainer: {
    textAlign: "center",
  },
});

interface IShowRoom {
  excludedVehicles?: VehicleType[];
  isPremiumUser: boolean;
}

const ShowRoomComponent = (props: IShowRoom) => {
  const history = useHistory();
  const canvasWrapperRef = useRef();
  const [chassisNum, setChassisNum] = useState(0);
  const [vehicleTypeNum, setVehicleTypeNum] = useState(0);
  const [showBuyPremium, setShowBuyPremium] = useState(false);

  const classes = useStyles();

  const possibleVehcileTypes = props.excludedVehicles
    ? allVehicleTypes.filter(
        (vehicle) => !stringInArray(vehicle.type, props.excludedVehicles)
      )
    : allVehicleTypes;

  useEffect(() => {
    return () => {
      console.log("component unmounted");
      removeShowRoomCanvas();
    };
  }, []);

  possibleVehicleColors;
  useEffect(() => {
    const renderer = createShowRoomCanvas(
      possibleVehcileTypes[
        Math.abs(vehicleTypeNum % possibleVehcileTypes.length)
      ].type,
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

      renderer.domElement.setAttribute("style", "max-width:100%;");
      // @ts-ignore
      canvasWrapperRef.current.appendChild(renderer.domElement);
    }

    if (
      possibleVehcileTypes[vehicleTypeNum % possibleVehcileTypes.length]
        .type === "normal"
    ) {
      setShowBuyPremium(false);
    } else {
      setShowBuyPremium(true);
    }
  }, [chassisNum, vehicleTypeNum]);

  return (
    <React.Fragment>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <div ref={canvasWrapperRef}></div>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6" component="div">
            {
              possibleVehcileTypes[vehicleTypeNum % possibleVehcileTypes.length]
                ?.name
            }
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Collapse in={showBuyPremium}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography color="InfoText" style={{ textAlign: "center" }}>
                  This is a Premium vehicle available only to Premium users.
                </Typography>
              </Grid>
              <Grid item xs={12} style={{ textAlign: "center" }}>
                <Button
                  variant="contained"
                  onClick={() => history.push(buyPremiumPagePath)}
                >
                  Go Premium
                </Button>
              </Grid>
            </Grid>
          </Collapse>
        </Grid>

        <Grid item xs={3} />
        <Grid item xs={3} className={classes.arrowContainer}>
          <IconButton
            onClick={() => {
              if (vehicleTypeNum === 0) {
                setVehicleTypeNum(possibleVehcileTypes.length - 1);
              } else {
                setVehicleTypeNum(vehicleTypeNum - 1);
              }
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
              if (chassisNum === 0) {
                setChassisNum(possibleVehicleColors.length - 1);
              } else {
                setChassisNum(chassisNum - 1);
              }
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
    </React.Fragment>
  );
};

export default ShowRoomComponent;
