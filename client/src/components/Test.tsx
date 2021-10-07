import React, { useEffect, useState } from "react";
import { IPlayerInfo, IGameSettings } from "../classes/Game";
import { createSocket } from "../utils/connectSocket";
import GameRoom from "./GameRoom";
import { IStore } from "./store";
import { Socket } from "socket.io-client";
import { MobileControls, VehicleControls } from "../utils/ControlsClasses";
import { getDeviceType } from "../utils/settings";

const Test = () => {
  const [socket, setSocket] = useState(undefined as Socket | undefined);
  const [roomName, setRoomName] = useState("testRoom");
  const [players, setPlayers] = useState([
    {
      playerName: "testsen",
      bothConnected: true,
      isLeader: true,
      teamName: "0",
      playerNumber: 0,
      mobileControls: new MobileControls(),
      vehicleControls: new VehicleControls(),
      teamNumber: 0,
    },
  ] as IPlayerInfo[]);
  const [player, setPlayer] = useState(undefined as IPlayerInfo | undefined);
  const [gameSettings, setGameSettings] = useState({
    ballRadius: 1,
    typeOfGame: "race",
  } as IGameSettings);

  const deviceType = getDeviceType();
  useEffect(() => {
    const newSocket = createSocket(deviceType);
    setSocket(newSocket);
  }, []);

  const store = {
    roomName,
    setRoomName,
    players,
    setPlayers,
    player,
    setPlayer,
    gameSettings,
    setGameSettings,
  } as IStore;

  // if (deviceType === "mobile") {
  //   return (
  //     <div>
  //       <h3>This is a test</h3>
  //       <p>You are on mobile</p>
  //     </div>
  //   );
  // }

  return <GameRoom socket={socket} store={store} />;

  return (
    <div>
      <h1>Testing</h1>
      <p>This is a test component</p>
    </div>
  );
};

export default Test;
