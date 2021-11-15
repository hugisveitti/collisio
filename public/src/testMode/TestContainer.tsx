import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Socket } from "socket.io-client";
import { defaultPreGameSettings } from "../classes/Game";
import { defaultUserSettings } from "../classes/User";
import GameRoom from "../components/gameRoom/GameRoom";
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

const TestContainer = () => {
  const [socket, setSocket] = useState(undefined as Socket | undefined);
  const [roomId, setRoomId] = useState("testRoom");
  const [players, setPlayers] = useState([] as IPlayerInfo[]);
  const [player, setPlayer] = useState(undefined as IPlayerInfo | undefined);
  const [userSettings, setUserSettings] = useState(defaultUserSettings);
  const [preGameSettings, setPreGameSettings] = useState(
    defaultPreGameSettings
  );

  const [canStartGame, setCanStartGame] = useState(true);

  const deviceType = getDeviceType();
  const onMobile = deviceType === "mobile";

  useEffect(() => {
    createSocket(deviceType, (newSocket) => setSocket(newSocket), "test");
  }, []);

  useEffect(() => {
    if (!socket) return;

    const nplayer = {
      playerName: "tester",
      isLeader: true,
      playerNumber: 0,
      teamName: "no team",
      mobileControls: new MobileControls(),
      vehicleControls: new VehicleControls(),
      id: "1",
      vehicleType:
        (window.localStorage.getItem("vehicleType") as VehicleType) ?? "f1",
    } as IPlayerInfo;
    setPlayers([nplayer]);
    // setPlayer(nplayer);
    setRoomId("testRoom");
    setPlayer(nplayer);

    socket.on("test-made-connection", () => {
      toast("A test connection was made");
    });

    return () => {};
  }, [socket]);

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

  if (!socket) return <span>Loading test setup...</span>;
  if (onMobile && !store.player) return <span>Loading test setup...</span>;

  // if (!onMobile && !canStartGame)
  //   return <span>Loading test setup desktop...</span>;

  return (
    <React.Fragment>
      {onMobile ? (
        <ControlsRoom socket={socket} store={store} />
      ) : (
        <GameRoom store={store} socket={socket} useTestCourse isTestMode />
      )}
      <ToastContainer />
    </React.Fragment>
  );
};

export default TestContainer;
