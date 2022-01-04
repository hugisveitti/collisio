import React, { useContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { Socket } from "socket.io-client";
import {
  getDefaultTrackFromGameType,
  getGameTypeFromTrackName,
} from "../classes/Game";
import {
  defaultGameSettings,
  getAllLocalGameSettings,
} from "../classes/localGameSettings";
import { defaultUserSettings } from "../classes/User";
import {
  getDBUserSettings,
  setDBUserSettings,
} from "../firebase/firestoreFunctions";
import ControlsRoomContainer from "../mobile/ControlsRoomContainer";
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
import HighscorePage from "./highscore/HighscorePage";
import HowToPlayPage from "./HowToPlayPage";
import MobileOnlyWaitingRoom from "./mobileOnly/MobileOnlyWaitingRoom";
import BuyPremiumComponent from "./monitary/BuyPremiumComponent";
import NotFoundPage from "./NotFoundPage";
import PrivateProfileAllTournamentsList from "./profile/PrivateProfileAllTournamentsList";
import PrivateProfilePage from "./profile/PrivateProfilePage";
import PublicProfilePageContainer from "./profile/PublicProfilePageContainer";
import ShowRoomContainer from "./showRoom/ShowRoomContainer";
import { IStore } from "./store";
import CreateTournamentContainer from "./tournament/CreateTournamentContainer";
import TournamentPageContainer from "./tournament/TournamentOverviewContainer";
import TrophyRoomContainer from "./trophy/TrophyRoomContainer";
import ConnectToWaitingRoomContainer from "./waitingRoom/ConnectToWaitingRoomContainer";
import WaitingRoom from "./waitingRoom/WaitingRoomContainer";

export const frontPagePath = "/";
export const waitingRoomPath = "/wait";
export const waitingRoomGameIdPath = "/wait/:roomId";
export const gameRoomPath = "/game";
export const gameRoomIdPath = "/game/:roomId";
export const controlsRoomPath = "/controls";
export const controlsRoomIdPath = "/controls/:roomId";
export const howToPlayPagePath = "/how-to-play";
export const highscorePagePath = "/highscores";
export const privateProfilePagePath = "/private-profile";
export const privateProfileTournamentsPagePath = "/private-profile/tournaments";
export const publicProfilePagePath = "/user/:profileId";
export const publicProfilePath = "/user";
export const showRoomPagePath = "/show-room";
export const buyPremiumPagePath = "/premium";
export const aboutPagePath = "/about";
export const connectPagePath = "/connect";
export const tournamentPagePath = "/tournament";
export const createTournamentPagePath = "/tournament/create";
export const tournamentIdPagePath = "/tournament/:tournamentId";
export const trophyRoomPath = "/trophy";
export const trophyRoomIdPath = "/trophy/:id";
export const mobileOnlyWaitingRoomPath = "/mobile-only-wait";

export const getUserPagePath = (userId: string) =>
  `${publicProfilePath}/${userId}`;

export const getTournamentPagePath = (tournamentId: string) =>
  `${tournamentPagePath}/${tournamentId}`;

export const getGameRoomPath = (roomId: string) => `${gameRoomPath}/${roomId}`;

export const getWaitingRoomPath = (roomId: string) =>
  `${waitingRoomPath}/${roomId}`;

export const getControlsRoomPath = (roomId: string) =>
  `${controlsRoomPath}/${roomId}`;

export const getTrophyRoomPath = (id: string) => `${trophyRoomPath}/${id}`;

const Routes = () => {
  const [socket, setSocket] = useState(undefined as Socket | undefined);
  const [roomId, setRoomId] = useState("");
  const [players, setPlayers] = useState([] as IPlayerInfo[]);
  const [player, setPlayer] = useState(undefined as IPlayerInfo | undefined);
  const [userSettings, setUserSettings] = useState(defaultUserSettings);
  const [gameSettings, setGameSettings] = useState(
    inTestMode ? testGameSettings : defaultGameSettings
  );
  const [activeBracketNode, setActiveBracketNode] = useState(undefined);

  // not sure how to implement tournaments
  const [tournament, setTournament] = useState(undefined);

  const deviceType = getDeviceType();

  useEffect(() => {
    if (!inTestMode) {
      const _gameSettings = getAllLocalGameSettings();

      if (
        _gameSettings.gameType !==
        getGameTypeFromTrackName(_gameSettings.trackName)
      ) {
        _gameSettings.trackName = getDefaultTrackFromGameType(
          _gameSettings.gameType
        );
      }
      store.setGameSettings(_gameSettings);
    }

    if (inTestMode) {
      const _gameSettings = getAllLocalGameSettings();
      store.setGameSettings(testGameSettings);

      setPlayers([fakePlayer1, fakePlayer2, fakePlayer3, fakePlayer4]);
      // setPlayers([fakePlayer1]);
      setPlayer(fakePlayer1);

      createSocket(getDeviceType(), (_s) => setSocket(_s));
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
    socket,
    setSocket,
    tournament,
    setTournament,
    activeBracketNode,
    setActiveBracketNode,
  };

  const user = useContext(UserContext);
  useEffect(() => {
    if (user?.uid) {
      getDBUserSettings(user.uid).then((dbUserSettings) => {
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

  if (inTestMode && !store.socket) return null;

  return (
    <Router>
      <Switch>
        <Route
          exact
          path={frontPagePath}
          render={(props) => <OneMonitorFrontPage {...props} store={store} />}
        />
        <Route
          // the order matters, the :Id must be first
          path={[waitingRoomGameIdPath, waitingRoomPath]}
          render={(props) => <WaitingRoom {...props} store={store} />}
        />
        <Route
          path={gameRoomPath}
          render={(props) => (
            <GameRoom {...props} store={store} isTestMode={inTestMode} />
          )}
        />
        <Route
          path={[controlsRoomIdPath, controlsRoomPath]}
          render={(props) => <ControlsRoomContainer {...props} store={store} />}
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
          exact
          path={privateProfileTournamentsPagePath}
          render={(props) => <PrivateProfileAllTournamentsList {...props} />}
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
          path={publicProfilePagePath}
          render={(props) => <PublicProfilePageContainer {...props} />}
        />
        <Route
          path={createTournamentPagePath}
          exact
          render={(props) => <CreateTournamentContainer {...props} />}
        />
        <Route
          /** the order matters */
          path={[tournamentIdPagePath, tournamentPagePath]}
          render={(props) => <TournamentPageContainer {...props} />}
        />
        <Route
          path={connectPagePath}
          render={(props) => (
            <ConnectToWaitingRoomContainer {...props} store={store} />
          )}
        />
        <Route
          path={[trophyRoomIdPath, trophyRoomPath]}
          render={(props) => <TrophyRoomContainer {...props} />}
        />
        <Route
          path={mobileOnlyWaitingRoomPath}
          render={(props) => <MobileOnlyWaitingRoom {...props} />}
        />
        <Route path={"/*"} render={(props) => <NotFoundPage {...props} />} />
      </Switch>
    </Router>
  );
};

export default Routes;
