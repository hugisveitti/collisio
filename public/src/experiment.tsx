import React, { useContext, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import {
  defaultGameSettings,
  defaultRoomSettings,
  getAllLocalGameSettings,
  getAllLocalRoomSettings,
} from "./classes/localGameSettings";
import {
  defaultUserSettings,
  IUserSettings,
  IVehicleSettings,
} from "./classes/User";
import { IStore } from "./components/store";
import UserProvider, { UserContext } from "./providers/UserProvider";
import {
  defaultVehicleType,
  IPlayerInfo,
  VehicleType,
} from "./shared-backend/shared-stuff";
import MobileGameExperiment from "./testMode/MobileGameExperiment";
import SpeedTestContainer from "./testMode/SpeedTestContainer";
import TestContainer from "./testMode/TestContainer";
import { createSocket } from "./utils/connectSocket";
import { getDeviceType } from "./utils/settings";
import { defaultVehiclesSetup } from "./vehicles/VehicleSetup";

export const mobileOnlyPath = "/mobileonly";
export const speedTestPath = "/speedtest";

const TestApp = () => {
  const user = useContext(UserContext);

  const [roomId, setRoomId] = useState("testRoom");
  const [players, setPlayers] = useState([] as IPlayerInfo[]);
  const [player, setPlayer] = useState(undefined as IPlayerInfo | undefined);
  const [userSettings, setUserSettings] = useState(defaultUserSettings);
  const [gameSettings, setGameSettings] = useState(defaultGameSettings);
  const [roomSettings, setRoomSettings] = useState(defaultRoomSettings);
  const [tokenData, setTokenData] = useState(undefined);
  const [activeBracketNode, setActiveBracketNode] = useState(undefined);

  // not sure how to implement tournaments
  const [tournament, setTournament] = useState(undefined);
  const [previousPage, setPreviousPage] = useState("");
  const deviceType = getDeviceType();
  const [vehiclesSetup, setVehiclesSetup] = useState(defaultVehiclesSetup);

  const onMobile = deviceType === "mobile";

  useEffect(() => {
    createSocket(deviceType, "test").then(() => {
      // socket = newSocket;
    });
    const _gameSettings = getAllLocalGameSettings();
    store.setGameSettings(_gameSettings);
    const _roomSettings = getAllLocalRoomSettings();
    store.setRoomSettings(_roomSettings);
  }, []);

  useEffect(() => {
    const vehicleType: VehicleType =
      (window.localStorage.getItem("vehicleType") as VehicleType) ??
      defaultVehicleType;

    const newVehicleSettings: IVehicleSettings = {
      ...userSettings.vehicleSettings,
      vehicleType,
    };

    const newUserSettings: IUserSettings = {
      ...userSettings,
      vehicleSettings: newVehicleSettings,
    };

    setUserSettings(newUserSettings);
  }, []);

  const store = {
    roomId,
    setRoomId,
    players,
    setPlayers,
    player,
    setPlayer,
    gameSettings,
    setGameSettings,
    roomSettings,
    setRoomSettings,
    userSettings,
    setUserSettings,
    tournament,
    setTournament,
    activeBracketNode,
    setActiveBracketNode,
    previousPage,
    setPreviousPage,
    tokenData,
    setTokenData,
    vehiclesSetup,
    setVehiclesSetup,
  } as IStore;

  return (
    <React.Fragment>
      <UserProvider>
        <Router basename="/">
          <Switch>
            <Route
              path={mobileOnlyPath}
              render={() => <MobileGameExperiment store={store} />}
            />
            <Route
              path="/test"
              render={() => <TestContainer onMobile={onMobile} store={store} />}
            />
            <Route path={speedTestPath} render={() => <SpeedTestContainer />} />
          </Switch>
        </Router>
      </UserProvider>
      <ToastContainer limit={3} pauseOnFocusLoss={false} />
    </React.Fragment>
  );
};

ReactDOM.render(<TestApp />, document.getElementById("root"));
