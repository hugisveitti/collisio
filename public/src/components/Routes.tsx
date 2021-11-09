import React, { useContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { Socket } from "socket.io-client";
import { defaultPreGameSettings } from "../classes/Game";
import { createSocket } from "../utils/connectSocket";
import { getDeviceType, inTestMode } from "../utils/settings";
import ControlsRoom from "../mobile/ControlsRoom";
import GameRoom from "./gameRoom/GameRoom";
import HighscorePage from "./HighscorePage";
import HowToPlayPage from "./HowToPlayPage";
import OneMonitorFrontPage from "./FrontPage";
import PrivateProfilePage from "./profile/PrivateProfilePage";
import { IStore } from "./store";
import WaitingRoom from "./waitingRoom/WaitingRoomContainer";
import ShowRoomComponent from "./showRoom/ShowRoomComponent";
import { UserContext } from "../providers/UserProvider";
import {
  getDBUserSettings,
  setDBUserSettings,
} from "../firebase/firebaseFunctions";
import { defaultUserSettings } from "../classes/User";
import { CircularProgress } from "@mui/material";
import {
  IPlayerInfo,
  MobileControls,
  VehicleControls,
} from "../shared-backend/shared-stuff";

export const frontPagePath = "/";
export const waitingRoomPath = "/wait";
export const waitingRoomGameIdPath = "/wait/:roomId";
export const gameRoomPath = "/game";
export const controlsRoomPath = "/controls";
export const howToPlayPagePath = "/how-to-play";
export const highscorePagePath = "/highscores";
export const privateProfilePagePath = "/private-profile";
export const publicProfilePagePath = "/public-profile/:id";
export const showRoomPagePath = "/show-room";

const Routes = () => {
  const [socket, setSocket] = useState(undefined as Socket | undefined);
  const [roomId, setRoomId] = useState("");
  const [players, setPlayers] = useState([] as IPlayerInfo[]);
  const [player, setPlayer] = useState(undefined as IPlayerInfo | undefined);
  const [userSettings, setUserSettings] = useState(defaultUserSettings);
  const [preGameSettings, setPreGameSettings] = useState(
    defaultPreGameSettings
  );
  const deviceType = getDeviceType();

  useEffect(() => {
    const newSocket = createSocket(deviceType);
    setSocket(newSocket);

    if (inTestMode) {
      const _player: IPlayerInfo = {
        playerName: "test",
        isLeader: true,
        teamName: "test",
        playerNumber: 0,
        mobileControls: new MobileControls(),
        vehicleControls: new VehicleControls(),
        teamNumber: 0,
        id: "0",
        isAuthenticated: false,
        vehicleType: "f1",
        isConnected: true,
      };
      setPlayers([_player]);
      setPlayer(_player);
    }
  }, []);

  const store = {
    roomId,
    setRoomId,
    players,
    setPlayers,
    player,
    setPlayer,
    preGameSettings,
    setPreGameSettings,
    userSettings,
    setUserSettings,
  } as IStore;

  const user = useContext(UserContext);
  useEffect(() => {
    if (user?.uid) {
      getDBUserSettings(user.uid, (dbUserSettings) => {
        if (dbUserSettings) {
          const newUserSettings = {
            ...userSettings,
            ...dbUserSettings,
          };

          store.setUserSettings(newUserSettings);
        } else {
          setDBUserSettings(user.uid, defaultUserSettings);
        }
      });
    }
  }, [user]);

  if (!socket) return <CircularProgress />;
  return (
    <Router>
      <Switch>
        <Route
          exact
          path={frontPagePath}
          render={(props) => (
            <OneMonitorFrontPage {...props} socket={socket} store={store} />
          )}
        />
        <Route
          // the order matters, the :Id must be first
          path={[waitingRoomGameIdPath, waitingRoomPath]}
          render={(props) => (
            <WaitingRoom {...props} socket={socket} store={store} />
          )}
        />
        <Route
          path={gameRoomPath}
          render={(props) => (
            <GameRoom {...props} socket={socket} store={store} />
          )}
        />
        <Route
          path={controlsRoomPath}
          render={(props) => (
            <ControlsRoom {...props} socket={socket} store={store} />
          )}
        />
        <Route
          path={howToPlayPagePath}
          render={(props) => <HowToPlayPage {...props} />}
        />
        <Route
          path={highscorePagePath}
          render={(props) => <HighscorePage {...props} />}
        />
        <Route
          path={privateProfilePagePath}
          render={(props) => <PrivateProfilePage {...props} />}
        />
        <Route
          path={showRoomPagePath}
          render={(props) => <ShowRoomComponent {...props} />}
        />
      </Switch>
    </Router>
  );
};

export default Routes;
