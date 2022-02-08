import React, { useEffect, useRef } from "react";
import {
  VehicleColorType,
  VehicleType,
} from "../../shared-backend/shared-stuff";
import { VehicleSetup } from "../../shared-backend/vehicleItems";
import { getDeviceType } from "../../utils/settings";
import {
  changeChassisColor,
  changeVehicleSetup,
  createShowRoomCanvas,
  removeShowRoomCanvas,
  setShowRoomOffset,
} from "../showRoom/showRoomCanvas";

interface IGarageVehicle {
  vehicleType: VehicleType;
  vehicleColor: VehicleColorType;
  vehicleSetup: VehicleSetup;
}

const GarageVehicle = (props: IGarageVehicle) => {
  const canvasWrapperRef = useRef();
  const onMobile = getDeviceType() === "mobile";

  useEffect(() => {
    return () => {
      removeShowRoomCanvas();
    };
  }, []);

  useEffect(() => {
    const renderer = createShowRoomCanvas(
      props.vehicleType,
      0,
      props.vehicleColor,
      props.vehicleSetup,
      onMobile ? 400 : 800
    );
    if (canvasWrapperRef.current && renderer) {
      renderer.domElement.setAttribute("style", "max-width:100%;");
      // @ts-ignore
      canvasWrapperRef.current.appendChild(renderer.domElement);
      setShowRoomOffset(12, 3);
    }
  }, [props.vehicleType]);

  useEffect(() => {
    if (canvasWrapperRef) {
      changeChassisColor(props.vehicleColor);
    }
  }, [props.vehicleColor]);

  useEffect(() => {
    changeVehicleSetup(props.vehicleSetup);
  }, [props.vehicleSetup]);

  return <div ref={canvasWrapperRef}></div>;
};

export default GarageVehicle;
