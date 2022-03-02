import React, { useContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { Socket } from "socket.io-client";
import {
  getDefaultTrackFromGameType,
  getGameTypeFromTrackName,
} from "../classes/Game";
import {
  defaultGameSettings,
  defaultRoomSettings,
  getAllLocalGameSettings,
  getAllLocalRoomSettings,
} from "../classes/localGameSettings";
import { defaultUserSettings } from "../classes/User";
import CookiesInfoPage from "../extra/CookiesInfoPage";
import PrivayPolicyComponent from "../extra/PrivacyPolicyComponent";
import TermsOfUse from "../extra/TermsOfUsePage";
import {
  getDBUserSettings,
  setDBUserSettings,
} from "../firebase/firestoreFunctions";
import { getVehiclesSetup } from "../firebase/firestoreOwnershipFunctions";
import ControlsRoomContainer from "../mobile/ControlsRoomContainer";
import { UserContext } from "../providers/UserProvider";
import { IPlayerInfo } from "../shared-backend/shared-stuff";
import {
  fakePlayer1,
  fakePlayer2,
  fakePlayer3,
  fakePlayer4,
} from "../tests/fakeData";
import { createSocket, getSocket } from "../utils/connectSocket";
import {
  getDeviceType,
  inTestMode,
  testGameSettings,
  testRoomSettings,
} from "../utils/settings";
import AboutPageComponent from "./AboutPageComponent";
import FrontPageContainer from "./frontpage/FrontPageContainer";
import GameRoom from "./gameRoom/GameRoom";
import GarageContainer from "./garage/GarageContainer";
import HighscorePage from "./highscore/HighscorePage";
import HowToPlayPage from "./HowToPlayPage";
import LoginPageContainer from "./login/LoginPageContainer";
import MobileOnlyWaitingRoom from "./mobileOnly/MobileOnlyWaitingRoom";
import BuyCoinsComponent from "./monitary/BuyCoinsComponent";
import BuyPremiumComponent from "./monitary/BuyPremiumComponent";
import PaymentCallbackContainer from "./monitary/PaymentCallbackContainer";
import MultiplayerConnectRoomContainer from "./multiplayer/MultiplayerConnectRoomContainer";
import MultiplayerControlsRoomContainer from "./multiplayer/MultiplayerControlsRoomContainer";
import MultiplayerWaitingRoomContainer from "./multiplayer/MultiplayerWaitingRoomContainer";
import MultiplayerGameRoom from "./multiplayerGameRoom/MuliplayerGameRoom";
import NotFoundPage from "./NotFoundPage";
import PrivateProfileAllTournamentsList from "./profile/PrivateProfileAllTournamentsList";
import PrivateProfilePage from "./profile/PrivateProfilePage";
import PublicProfilePageContainer from "./profile/PublicProfilePageContainer";
import ShowRoomContainer from "./showRoom/ShowRoomContainer";
import { IStore } from "./store";
import CreateTournamentContainer from "./tournament/CreateTournamentContainer";
import TournamentPageContainer from "./tournament/TournamentOverviewContainer";
import TrackSelectContainer from "./trackSelectContainer/TrackSelectContainer";
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
export const connectIdPagePath = "/connect/:roomId";
export const tournamentPagePath = "/tournament";
export const createTournamentPagePath = "/tournament/create";
export const tournamentIdPagePath = "/tournament/:tournamentId";
export const trophyRoomPath = "/trophy";
export const trophyRoomIdPath = "/trophy/:id";
export const mobileOnlyWaitingRoomPath = "/mobile-only-wait";
export const privacyPolicyPage = "/privacy-policy";
export const loginPagePath = "/login";
export const garagePagePath = "/garage";
export const trackPagePath = "/tracks";
export const buyCoinsPagePath = "/buycoins";
export const successfullPaymentPagePath = "/successfulpayment";
export const cancelPaymentPagePath = "/cancelpayment";
export const multiplayerConnectPagePath = "/multiplayer";
export const multiplayerRoomIdPagePath = "/multiplayer/:roomId";
export const multiplayerGameRoomIdPagePath = "/multiplayer/game/:roomId";
const multiplayerControlsRoomIdPagePath = "/multiplayer/controls/:roomId";
const multiplayerControlsPagePath = "/multiplayer/controls";
export const cookiesInfoPagePath = "/cookies";
export const termsOfUsePagePath = "/termsOfUse";

const multiplayerGameRoomPagePath = "/multiplayer/game";

export const getMultiplayerControlsRoomPath = (roomId: string) =>
  `${multiplayerControlsPagePath}/${roomId}`;

export const getMultiplayerGameRoomPath = (roomId: string) =>
  `${multiplayerGameRoomPagePath}/${roomId}`;

export const getMultiplayerWaitingRoom = (roomId: string) =>
  `${multiplayerConnectPagePath}/${roomId}`;

export const getUserPagePath = (userId: string) =>
  `${publicProfilePath}/${userId}`;

export const getTournamentPagePath = (tournamentId: string) =>
  `${tournamentPagePath}/${tournamentId}`;

export const getGameRoomPath = (roomId: string) => `${gameRoomPath}/${roomId}`;

export const getWaitingRoomPath = (roomId: string) =>
  `${waitingRoomPath}/${roomId}`;

export const getConnectPagePath = (roomId: string) =>
  `${connectPagePath}/${roomId}`;

export const getControlsRoomPath = (roomId: string) =>
  `${controlsRoomPath}/${roomId}`;

export const getTrophyRoomPath = (id: string) => `${trophyRoomPath}/${id}`;

let socket = undefined as Socket | undefined;
const Routes = () => {
  const [roomId, setRoomId] = useState("");
  const [players, setPlayers] = useState([] as IPlayerInfo[]);
  const [player, setPlayer] = useState(undefined as IPlayerInfo | undefined);
  const [userSettings, setUserSettings] = useState(defaultUserSettings);
  const [gameSettings, setGameSettings] = useState(
    inTestMode ? testGameSettings : defaultGameSettings
  );

  const [roomSettings, setRoomSettings] = useState(
    inTestMode ? testRoomSettings : defaultRoomSettings
  );

  const [activeBracketNode, setActiveBracketNode] = useState(undefined);

  // not sure how to implement tournaments
  const [tournament, setTournament] = useState(undefined);
  const [previousPage, setPreviousPage] = useState("");
  const deviceType = getDeviceType();

  const [tokenData, setTokenData] = useState(undefined);
  const [vehiclesSetup, setVehiclesSetup] = useState(undefined);

  useEffect(() => {
    if (!inTestMode) {
      const _roomSettings = getAllLocalRoomSettings();

      if (
        _roomSettings.gameType !==
        getGameTypeFromTrackName(_roomSettings.trackName)
      ) {
        _roomSettings.trackName = getDefaultTrackFromGameType(
          _roomSettings.gameType
        );
      }
      store.setRoomSettings(_roomSettings);

      const _gameSettings = getAllLocalGameSettings();
      store.setGameSettings(_gameSettings);
    }

    if (inTestMode) {
      const _gameSettings = getAllLocalGameSettings();
      store.setGameSettings(testGameSettings);

      setPlayers([fakePlayer1, fakePlayer2, fakePlayer3, fakePlayer4]);
      // setPlayers([fakePlayer1]);
      setPlayer(fakePlayer1);

      createSocket(getDeviceType()).then((_s) => {});
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
    roomSettings,
    setRoomSettings,
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

      getVehiclesSetup(user.uid).then((_vehiclesSetup) => {
        setVehiclesSetup(_vehiclesSetup);
      });
    }
  }, [user]);

  const socket = getSocket();

  if (inTestMode && !socket) return null;

  return (
    <Router>
      <Switch>
        <Route
          exact
          path={frontPagePath}
          //  render={(props) => <OneMonitorFrontPage {...props} store={store} />}
          render={(props) => <FrontPageContainer {...props} store={store} />}
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
          render={(props) => <PrivateProfilePage {...props} store={store} />}
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
          render={(props) => (
            <TournamentPageContainer {...props} store={store} />
          )}
        />
        <Route
          path={[connectIdPagePath, connectPagePath]}
          render={(props) => (
            <ConnectToWaitingRoomContainer {...props} store={store} />
          )}
        />
        <Route
          path={[trophyRoomIdPath, trophyRoomPath]}
          render={(props) => <TrophyRoomContainer {...props} store={store} />}
        />
        <Route
          path={mobileOnlyWaitingRoomPath}
          render={(props) => <MobileOnlyWaitingRoom {...props} store={store} />}
        />
        <Route
          path={privacyPolicyPage}
          render={(props) => <PrivayPolicyComponent />}
        />
        <Route
          path={loginPagePath}
          render={(props) => <LoginPageContainer />}
        />
        <Route
          path={garagePagePath}
          render={(props) => <GarageContainer {...props} store={store} />}
        />
        <Route
          path={trackPagePath}
          render={(props) => <TrackSelectContainer {...props} store={store} />}
        />
        <Route
          path={buyCoinsPagePath}
          render={(props) => <BuyCoinsComponent {...props} store={store} />}
        />
        <Route
          path={successfullPaymentPagePath}
          render={(props) => (
            <PaymentCallbackContainer {...props} store={store} />
          )}
        />
        <Route
          path={cancelPaymentPagePath}
          render={(props) => (
            <PaymentCallbackContainer canceled {...props} store={store} />
          )}
        />
        <Route
          path={[
            multiplayerControlsRoomIdPagePath,
            multiplayerControlsPagePath,
          ]}
          render={(props) => <MultiplayerControlsRoomContainer store={store} />}
        />
        <Route
          path={[multiplayerGameRoomIdPagePath, multiplayerGameRoomPagePath]}
          render={(props) => <MultiplayerGameRoom {...props} store={store} />}
        />
        <Route
          path={multiplayerRoomIdPagePath}
          render={(props) => (
            <MultiplayerWaitingRoomContainer {...props} store={store} />
          )}
        />
        <Route
          path={multiplayerConnectPagePath}
          render={(props) => (
            <MultiplayerConnectRoomContainer {...props} store={store} />
          )}
        />
        <Route
          path={cookiesInfoPagePath}
          render={(props) => <CookiesInfoPage {...props} />}
        />

        <Route
          path={termsOfUsePagePath}
          render={(props) => <TermsOfUse {...props} />}
        />

        <Route path={"/*"} render={(props) => <NotFoundPage {...props} />} />
      </Switch>
    </Router>
  );
};

export default Routes;
