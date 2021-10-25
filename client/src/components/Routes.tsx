import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { Socket } from "socket.io-client";
import { IGameSettings, IPlayerInfo } from "../classes/Game";
import { createSocket } from "../utils/connectSocket";
import { getDeviceType, startGameAuto } from "../utils/settings";
import ControlsRoom from "../mobile/ControlsRoom";
import GameRoom from "./GameRoom";
import HighscorePage from "./HighscorePage";
import HowToPlayPage from "./HowToPlayPage";
import OneMonitorFrontPage from "./FrontPage";
import PrivateProfilePage from "./PrivateProfilePage";
import { IStore } from "./store";
import WaitingRoom from "./WaitingRoom";
import { MobileControls, VehicleControls } from "../utils/ControlsClasses";

export const frontPagePath = "/";
export const waitingRoomPath = "/wait";
export const waitingRoomGameIdPath = "/wait/:roomId";
export const gameRoomPath = "/game";
export const controlsRoomPath = "/controls";
export const howToPlayPagePath = "/how-to-play";
export const highscorePagePath = "/highscores";
export const privateProfilePagePath = "/private-profile";
export const publicProfilePagePath = "/public-profile/:id";

const Routes = () => {
  const [socket, setSocket] = useState(undefined as Socket | undefined);
  const [roomId, setRoomId] = useState("");
  const [players, setPlayers] = useState([] as IPlayerInfo[]);
  const [player, setPlayer] = useState(undefined as IPlayerInfo | undefined);
  const [gameSettings, setGameSettings] = useState({
    ballRadius: 1,
    typeOfGame: "race",
    numberOfLaps: 3,
    trackName: "low-poly-farm-track",
  } as IGameSettings);

  const deviceType = getDeviceType();
  useEffect(() => {
    const newSocket = createSocket(deviceType);
    setSocket(newSocket);
    if (startGameAuto) {
      const nplayer = {
        playerName: "tester",
        isLeader: true,
        playerNumber: 0,
        teamName: "no team",
        mobileControls: new MobileControls(),
        vehicleControls: new VehicleControls(),
        id: "1",
      } as IPlayerInfo;
      setPlayers([nplayer]);
    }
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
  } as IStore;

  if (!socket) return null;
  return (
    <Router basename="/">
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
      </Switch>
    </Router>
  );
};

export default Routes;
