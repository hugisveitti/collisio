import React, { useContext, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { Socket } from "socket.io-client";
import {
  defaultGameSettings,
  getAllLocalGameSettings,
} from "./classes/localGameSettings";
import {
  defaultUserSettings,
  IUserSettings,
  IVehicleSettings,
} from "./classes/User";
import { IStore } from "./components/store";
import UserProvider, { UserContext } from "./providers/UserProvider";
import { IPlayerInfo, VehicleType } from "./shared-backend/shared-stuff";
import MobileGameExperiment from "./testMode/MobileGameExperiment";
import SpeedTestContainer from "./testMode/SpeedTestContainer";
import TestContainer from "./testMode/TestContainer";
import { createSocket } from "./utils/connectSocket";
import { getDeviceType } from "./utils/settings";

export const mobileOnlyPath = "/mobileonly";
export const speedTestPath = "/speedtest";

const TestApp = () => {
  const user = useContext(UserContext);

  const [socket, setSocket] = useState(undefined as Socket | undefined);
  const [roomId, setRoomId] = useState("testRoom");
  const [players, setPlayers] = useState([] as IPlayerInfo[]);
  const [player, setPlayer] = useState(undefined as IPlayerInfo | undefined);
  const [userSettings, setUserSettings] = useState(defaultUserSettings);
  const [gameSettings, setGameSettings] = useState(defaultGameSettings);

  const [activeBracketNode, setActiveBracketNode] = useState(undefined);

  // not sure how to implement tournaments
  const [tournament, setTournament] = useState(undefined);
  const [previousPage, setPreviousPage] = useState("");
  const deviceType = getDeviceType();
  const onMobile = deviceType === "mobile";

  useEffect(() => {
    console.log("gong to create socket");
    createSocket(deviceType, "test").then((newSocket) => setSocket(newSocket));
    const _gameSettings = getAllLocalGameSettings();
    store.setGameSettings(_gameSettings);
  }, []);

  useEffect(() => {
    const vehicleType: VehicleType =
      (window.localStorage.getItem("vehicleType") as VehicleType) ?? "normal2";

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
    userSettings,
    setUserSettings,
    socket,
    setSocket,
    tournament,
    setTournament,
    activeBracketNode,
    setActiveBracketNode,
    previousPage,
    setPreviousPage,
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
