import { CircularProgress } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { Socket } from "socket.io-client";
import { defaultPreGameSettings } from "../classes/Game";
import { defaultUserSettings } from "../classes/User";
import {
  getDBUserSettings,
  setDBUserSettings,
} from "../firebase/firebaseFunctions";
import ControlsRoom from "../mobile/ControlsRoom";
import { UserContext } from "../providers/UserProvider";
import {
  IPlayerInfo,
  MobileControls,
  VehicleControls,
} from "../shared-backend/shared-stuff";
import { createSocket } from "../utils/connectSocket";
import { getDeviceType, inTestMode } from "../utils/settings";
import BuyPremiumComponent from "./BuyPremiumComponent";
import OneMonitorFrontPage from "./FrontPage";
import GameRoom from "./gameRoom/GameRoom";
import HighscorePage from "./HighscorePage";
import HowToPlayPage from "./HowToPlayPage";
import PrivateProfilePage from "./profile/PrivateProfilePage";
import ShowRoomContainer from "./showRoom/ShowRoomContainer";
import { IStore } from "./store";
import WaitingRoom from "./waitingRoom/WaitingRoomContainer";

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
export const buyPremiumPagePath = "/premium";

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
          render={(props) => <ShowRoomContainer {...props} />}
        />
        <Route
          path={buyPremiumPagePath}
          render={(props) => <BuyPremiumComponent {...props} />}
        />
      </Switch>
    </Router>
  );
};

export default Routes;
