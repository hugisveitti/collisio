import { areDayPropsEqual } from "@mui/lab/PickersDay/PickersDay";
import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Socket } from "socket.io-client";
import {
  defaultGameSettings,
  getAllLocalGameSettings,
} from "../classes/localGameSettings";
import {
  defaultUserSettings,
  IUserSettings,
  IVehicleSettings,
} from "../classes/User";
import GameRoom from "../components/gameRoom/GameRoom";
import UserSettingsComponent from "../components/profile/UserSettingsComponent";
// import GameRoom from "../components/GameRoom";
import { IStore } from "../components/store";
import ControlsRoom from "../mobile/ControlsRoom";
import {
  IPlayerInfo,
  MobileControls,
  VehicleControls,
  VehicleType,
} from "../shared-backend/shared-stuff";
import { createSocket } from "../utils/connectSocket";
import { getDeviceType } from "../utils/settings";

interface ITestContainer {
  store: IStore;
  onMobile: boolean;
}

const TestContainer = (props: ITestContainer) => {
  if (props.onMobile && !props.store.player)
    return <span>Loading test setup...</span>;
  if (!props.store.socket) return <span>Loading test setup...</span>;

  // if (!onMobile && !canStartGame)
  //   return <span>Loading test setup desktop...</span>;

  return (
    <React.Fragment>
      {props.onMobile ? (
        <ControlsRoom store={props.store} />
      ) : (
        <GameRoom store={props.store} useTestCourse isTestMode />
      )}
    </React.Fragment>
  );
};

export default TestContainer;
