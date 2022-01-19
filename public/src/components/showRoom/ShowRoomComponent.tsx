import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Collapse from "@mui/material/Collapse";
import React, { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router";
import {
  defaultVehicleType,
  vehicleColors,
  VehicleType,
} from "../../shared-backend/shared-stuff";
import "../../styles/main.css";
import { itemInArray } from "../../utils/utilFunctions";
import { allVehicleTypes } from "../../vehicles/VehicleConfigs";
import { buyPremiumPagePath } from "../Routes";
import { createShowRoomCanvas, removeShowRoomCanvas } from "./showRoomCanvas";
import { getStyledColors } from "../../providers/theme";
import BackdropButton from "../button/BackdropButton";
import ToFrontPageButton from "../inputs/ToFrontPageButton";

// const allPossibleVehcileTypes: VehicleType[] = ["f1", "tractor", "normal", "truck", ];

interface IShowRoom {
  excludedVehicles?: VehicleType[];
  isPremiumUser: boolean;
  vehcileType?: VehicleType;
  vehicleColor?: string;
}

const ShowRoomComponent = (props: IShowRoom) => {
  const history = useHistory();
  const canvasWrapperRef = useRef();
  const [chassisNum, setChassisNum] = useState(0);
  const [vehicleTypeNum, setVehicleTypeNum] = useState(0);
  const [showBuyPremium, setShowBuyPremium] = useState(false);

  const possibleVehcileTypes = props.excludedVehicles
    ? allVehicleTypes.filter(
        (vehicle) => !itemInArray(vehicle.type, props.excludedVehicles)
      )
    : allVehicleTypes;

  useEffect(() => {
    return () => {
      removeShowRoomCanvas();
    };
  }, []);

  useEffect(() => {
    const renderer = createShowRoomCanvas(
      props.vehcileType ??
        possibleVehcileTypes[
          Math.abs(vehicleTypeNum % possibleVehcileTypes.length)
        ].type,
      chassisNum,
      props.vehicleColor
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
        .type === defaultVehicleType
    ) {
      setShowBuyPremium(false);
    } else {
      setShowBuyPremium(true);
    }
  }, [chassisNum, vehicleTypeNum, props.vehcileType, props.vehicleColor]);

  const { color, backgroundColor } = getStyledColors("black");
  return (
    <React.Fragment>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ToFrontPageButton color="white" />
        </Grid>
        <Grid item xs={12}>
          <div ref={canvasWrapperRef}></div>
        </Grid>
        {!props.vehcileType && (
          <>
            <Grid item xs={12}>
              <Typography variant="h6" component="div">
                {
                  possibleVehcileTypes[
                    vehicleTypeNum % possibleVehcileTypes.length
                  ]?.name
                }
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Collapse in={showBuyPremium}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography
                      color="InfoText"
                      style={{ textAlign: "center", color }}
                    >
                      This is a Premium vehicle available only to Premium users.
                    </Typography>
                  </Grid>
                  <Grid item xs={12} style={{ textAlign: "center" }}>
                    <BackdropButton
                      center
                      color="white"
                      link={buyPremiumPagePath}
                    >
                      Go Premium
                    </BackdropButton>
                  </Grid>
                </Grid>
              </Collapse>
            </Grid>

            <Grid item xs={3} />
            <Grid item xs={3} style={{ textAlign: "center" }}>
              <IconButton
                style={{ color }}
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
            <Grid item xs={3} style={{ textAlign: "center" }}>
              <IconButton
                style={{ color }}
                onClick={() => {
                  setVehicleTypeNum(vehicleTypeNum + 1);
                }}
              >
                <ArrowForwardIosIcon />
              </IconButton>
            </Grid>
            <Grid item xs={3} />

            <Grid item xs={3} />

            <Grid item xs={3} style={{ textAlign: "center" }}>
              <IconButton
                style={{ color }}
                onClick={() => {
                  if (chassisNum === 0) {
                    setChassisNum(vehicleColors.length - 1);
                  } else {
                    setChassisNum(chassisNum - 1);
                  }
                }}
              >
                <KeyboardArrowLeftIcon />
              </IconButton>
            </Grid>
            <Grid item xs={3} style={{ textAlign: "center" }}>
              <IconButton
                style={{ color }}
                onClick={() => {
                  setChassisNum(chassisNum + 1);
                }}
              >
                <KeyboardArrowRightIcon />
              </IconButton>
            </Grid>
            <Grid item xs={3} />
          </>
        )}
      </Grid>
    </React.Fragment>
  );
};

export default ShowRoomComponent;
