import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { Socket } from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/main.css";
import { ISocketCallback } from "../utils/connectSocket";
import { getDeviceType } from "../utils/settings";
import { waitingRoomPath } from "./Routes";
import { IStore } from "./store";

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
    const _roomName =
      props.store.roomName !== "" ? props.store.roomName : "testRoom";
    const _playerName = playerName !== "" ? playerName : "testPlayer";
    if (deviceType === "desktop") {
      createRoomDesktop(_roomName);
    } else {
      connectToRoomMobile(_roomName, _playerName);
    }
  };

  useEffect(() => {
    props.store.setRoomName("testRoom");
    setPlayerName("testPlayer");
    setTimeout(() => {
      // connectButtonClicked();
    }, 100);
  }, []);

  return (
    <div className="container">
      <h1 className="center">Join room</h1>
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
  );
};

export default OneMonitorFrontPage;
