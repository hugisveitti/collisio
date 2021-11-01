import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Socket } from "socket.io-client";
import {
  IPlayerInfo,
  defaultGameSettings,
  IPlayerConnection,
} from "../classes/Game";
import { defaultUserSettings } from "../classes/User";
import GameRoom from "../components/GameRoom";
// import GameRoom from "../components/GameRoom";
import { IStore } from "../components/store";
import ControlsRoom from "../mobile/ControlsRoom";
import { createSocket, ISocketCallback } from "../utils/connectSocket";
import { MobileControls, VehicleControls } from "../utils/ControlsClasses";
import { getDeviceType } from "../utils/settings";
import { socketHandleStartGame } from "../utils/socketFunctions";

const TestContainer = () => {
  const [socket, setSocket] = useState(undefined as Socket | undefined);
  const [roomId, setRoomId] = useState("testRoom");
  const [players, setPlayers] = useState([] as IPlayerInfo[]);
  const [player, setPlayer] = useState(undefined as IPlayerInfo | undefined);
  const [userSettings, setUserSettings] = useState(defaultUserSettings);
  const [gameSettings, setGameSettings] = useState(defaultGameSettings);

  const [canStartGame, setCanStartGame] = useState(false);

  const deviceType = getDeviceType();
  const onMobile = deviceType === "mobile";

  const createRoomDesktopCallback = () => {
    socket.once("create-room-callback", (response: ISocketCallback) => {
      if (response.status === "success") {
        const { roomId } = response.data;
        store.setRoomId(roomId);
        socketHandleStartGame(socket, (res) => {
          console.log("starting test game", res);
          setCanStartGame(true);
        });
      } else {
        toast.error(response.message);
      }
    });
  };

  useEffect(() => {
    const newSocket = createSocket(deviceType, "test");
    setSocket(newSocket);
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
      vehicleType: "f1",
    } as IPlayerInfo;
    setPlayers([nplayer]);
    // setPlayer(nplayer);
    setRoomId("testRoom");

    if (onMobile) {
      socket.emit("player-connected", {
        roomId,
        playerName: nplayer.id,
        playerId: nplayer.id,
        isAuthenticated: false,
        photoURL: "",
      } as IPlayerConnection);

      socket.once("player-connected-callback", (response: ISocketCallback) => {
        if (response.status === "error") {
          const { message } = response;
          toast.error(message);
        } else {
          toast.success(response.message);
          store.setPlayer(response.data.player);
        }
      });
    } else {
      socket.emit("create-room", { roomId });
      createRoomDesktopCallback();
    }
  }, [socket]);

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
  } as IStore;

  if (!socket) return <span>Loading test setup...</span>;
  if (onMobile && !store.player) return <span>Loading test setup...</span>;

  if (!onMobile && !canStartGame)
    return <span>Loading test setup desktop...</span>;

  return (
    <React.Fragment>
      {onMobile ? (
        <ControlsRoom socket={socket} store={store} />
      ) : (
        <GameRoom store={store} socket={socket} useTestCourse />
      )}
      <ToastContainer />
    </React.Fragment>
  );
};

export default TestContainer;
