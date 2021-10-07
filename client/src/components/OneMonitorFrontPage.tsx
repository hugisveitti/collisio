import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Socket } from "socket.io-client";
import "../styles/main.css";
import { startRaceTrackTest } from "../test-courses/raceTrackTest";
import { ISocketCallback } from "../utils/connectSocket";
import { getDeviceType, isTestMode, startGameAuto } from "../utils/settings";
import { waitingRoomPath } from "./Routes";
import { IStore } from "./store";

// const logo = require("../images/caroutline.png");
// import * as logo from "../images/caroutline.png";
// console.log("logo", logo);
interface IOneMonitorFrontPageProps {
  socket: Socket;
  store: IStore;
}

const OneMonitorFrontPage = (props: IOneMonitorFrontPageProps) => {
  const deviceType = getDeviceType();
  const [playerName, setPlayerName] = useState("");
  const history = useHistory();

  const renderPlayerNameInput = () => {
    if (deviceType === "mobile") {
      return (
        <input
          className="large-input"
          type="text"
          placeholder="player name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
      );
    }
    return null;
  };

  const goToWaitingRoom = () => {
    history.push(waitingRoomPath);
  };

  const connectToRoomMobile = (roomName: string, playerName: string) => {
    props.socket.emit("player-connected", { roomName, playerName });
    if (deviceType === "mobile") {
      props.socket.once(
        "player-connected-callback",
        (data: ISocketCallback) => {
          if (data.status === "error") {
            const { message } = data;
            toast.error(message);
          } else {
            toast.success(data.message);
            props.store.setPlayer(data.data.player);
            goToWaitingRoom();
          }
        }
      );
    }
  };

  const createRoomDesktop = (roomName: string) => {
    props.socket.emit("room-created", { roomName });
    props.socket.once("room-created-callback", (data: ISocketCallback) => {
      console.log("room created callback", data);
      if (data.status === "success") {
        goToWaitingRoom();
      } else {
        toast.error(data.message);
      }
    });
  };

  const connectButtonClicked = () => {
    let _roomName: string, _playerName: string;
    if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
      _roomName =
        props.store.roomName !== "" ? props.store.roomName : "testRoom";
      _playerName = playerName !== "" ? playerName : "testPlayer";
    } else {
      _playerName = playerName;
      _roomName = props.store.roomName;
    }
    if (deviceType === "desktop") {
      createRoomDesktop(_roomName);
    } else {
      connectToRoomMobile(_roomName, _playerName);
    }
  };

  useEffect(() => {
    if (startGameAuto) {
      props.store.setRoomName("testRoom");
      setPlayerName("testPlayer");
      setTimeout(() => {
        connectButtonClicked();
      }, 100);
    }
  }, []);

  if (isTestMode) {
    startRaceTrackTest(props.socket, props.store.gameSettings);
    return null;
  }

  return (
    <div>
      <div className="container">
        <h2 className="center">
          Welcome to <i>Collisio</i>
        </h2>
        <p>
          Create a room, you and 3 friends connect to that room with your mobile
          phones.
        </p>
        <p>Its a car game where your phone is the controller.</p>
        <h3 className="center">Create a room</h3>
        <p>
          Please type in the room name to create a room. Then all the players
          should type in the room name and their name on their mobile device.
        </p>
        <input
          className="large-input"
          type="text"
          placeholder="room name"
          value={props.store.roomName}
          onChange={(e) => props.store.setRoomName(e.target.value)}
        />
        <br />

        {renderPlayerNameInput()}

        <br />
        <button
          className="large-input"
          id="room-name-btn"
          onClick={connectButtonClicked}
        >
          Join
        </button>
        <hr />
        <p>This game is in development</p>
        <ToastContainer />
      </div>
    </div>
  );
};

export default OneMonitorFrontPage;
