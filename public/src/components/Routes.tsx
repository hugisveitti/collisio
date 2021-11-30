import CircularProgress from "@mui/material/CircularProgress";
import React, { useContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { Socket } from "socket.io-client";
import {
  defaultGameSettings,
  getAllLocalGameSettings,
} from "../classes/localGameSettings";
import { defaultUserSettings } from "../classes/User";
import {
  getDBUserSettings,
  setDBUserSettings,
} from "../firebase/firebaseFunctions";
import ControlsRoom from "../mobile/ControlsRoom";
import { UserContext } from "../providers/UserProvider";
import { IPlayerInfo } from "../shared-backend/shared-stuff";
import {
  fakePlayer1,
  fakePlayer2,
  fakePlayer3,
  fakePlayer4,
} from "../tests/fakeData";
import { createSocket } from "../utils/connectSocket";
import { getDeviceType, inTestMode, testGameSettings } from "../utils/settings";
import AboutPageComponent from "./AboutPageComponent";
import OneMonitorFrontPage from "./FrontPage";
import GameRoom from "./gameRoom/GameRoom";
import HighscorePage from "./HighscorePage";
import HowToPlayPage from "./HowToPlayPage";
import BuyPremiumComponent from "./monitary/BuyPremiumComponent";
import NotFoundPage from "./NotFoundPage";
import PrivateProfilePage from "./profile/PrivateProfilePage";
import ShowRoomContainer from "./showRoom/ShowRoomContainer";
import { IStore } from "./store";
import ConnectToWaitingRoomContainer from "./waitingRoom/ConnectToWaitingRoomContainer";
import WaitingRoom from "./waitingRoom/WaitingRoomContainer";

export const frontPagePath = "/";
export const waitingRoomPath = "/wait";
export const waitingRoomGameIdPath = "/wait/:roomId";
export const gameRoomPath = "/game";
export const controlsRoomPath = "/controls";
export const howToPlayPagePath = "/how-to-play";
export const highscorePagePath = "/highscores";
export const privateProfilePagePath = "/private-profile";
export const publicProfilePagePath = "/user/:id";
export const showRoomPagePath = "/show-room";
export const buyPremiumPagePath = "/premium";
export const aboutPagePath = "/about";
export const connectPagePath = "/connect";

const Routes = () => {
  const [socket, setSocket] = useState(undefined as Socket | undefined);
  const [roomId, setRoomId] = useState("");
  const [players, setPlayers] = useState([] as IPlayerInfo[]);
  const [player, setPlayer] = useState(undefined as IPlayerInfo | undefined);
  const [userSettings, setUserSettings] = useState(defaultUserSettings);
  const [gameSettings, setGameSettings] = useState(
    inTestMode ? testGameSettings : defaultGameSettings
  );
  const deviceType = getDeviceType();

  useEffect(() => {
    createSocket(deviceType, (_socket) => setSocket(_socket));

    if (!inTestMode) {
      const _gameSettings = getAllLocalGameSettings();
      store.setGameSettings(_gameSettings);
    }

    if (inTestMode) {
      const _gameSettings = getAllLocalGameSettings();
      store.setGameSettings(_gameSettings ?? testGameSettings);

      setPlayers([fakePlayer1, fakePlayer2, fakePlayer3, fakePlayer4]);
      // setPlayers([fakePlayer1]);
      setPlayer(fakePlayer1);
    }
  }, []);

  const store: IStore = {
    roomId,
    setRoomId,
    players,
    setPlayers,
    player,
    setPlayer,
    userSettings,
    setUserSettings,
    gameSettings,
    setGameSettings,
  };

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

  // possibly load the socket in the appContainer since not everything needs a socket
  if (!socket)
    return (
      <div style={{ margin: "auto", marginTop: 50, textAlign: "center" }}>
        <CircularProgress />
      </div>
    );

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
            <GameRoom
              {...props}
              socket={socket}
              store={store}
              isTestMode={inTestMode}
            />
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
        <Route
          path={aboutPagePath}
          render={(props) => <AboutPageComponent {...props} />}
        />
        <Route
          path={connectPagePath}
          render={(props) => (
            <ConnectToWaitingRoomContainer
              {...props}
              store={store}
              socket={socket}
            />
          )}
        />
        <Route path={"/*"} render={(props) => <NotFoundPage {...props} />} />
      </Switch>
    </Router>
  );
};

export default Routes;
