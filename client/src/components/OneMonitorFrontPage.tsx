import SportsScoreIcon from "@mui/icons-material/SportsScore";
import VideogameAssetIcon from "@mui/icons-material/VideogameAsset";
import { Button, Modal, Typography } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Socket } from "socket.io-client";
import logo from "../images/caroutline.png";
import { UserContext } from "../providers/UserProvider";
import "../styles/main.css";
import { startRaceTrackTest } from "../test-courses/raceTrackTest";
import { ISocketCallback } from "../utils/connectSocket";
import { getDeviceType, isTestMode, startGameAuto } from "../utils/settings";
import LoginComponent from "./LoginComponent";
import {
  controlsRoomPath,
  highscorePagePath,
  howToPlayPagePath,
  waitingRoomPath,
} from "./Routes";
import { IStore } from "./store";

interface IOneMonitorFrontPageProps {
  socket: Socket;
  store: IStore;
}

const OneMonitorFrontPage = (props: IOneMonitorFrontPageProps) => {
  const deviceType = getDeviceType();
  const [playerName, setPlayerName] = useState("");
  const [needToAskOrientPermission, setNeedToAskOrientPermission] =
    useState(true);

  const [notLoggedInModalOpen, setNotLoggedInModelOpen] = useState(false);
  const [showLoginInModal, setShowLoginInModal] = useState(false);
  const history = useHistory();

  const user = useContext(UserContext);

  useEffect(() => {
    if (user?.displayName) {
      setPlayerName(user.displayName);
    }
  }, [user]);

  const checkIfNeedOrientaitonPrompt = (e: DeviceOrientationEvent) => {
    const { beta, gamma, alpha } = e;

    if (beta || gamma || alpha) {
      setNeedToAskOrientPermission(false);
      window.removeEventListener(
        "deviceorientation",
        checkIfNeedOrientaitonPrompt
      );
    }
  };

  useEffect(() => {
    if (deviceType === "desktop") {
      setNeedToAskOrientPermission(false);
    } else {
      window.addEventListener(
        "deviceorientation",
        checkIfNeedOrientaitonPrompt
      );
    }
  }, []);

  const requestDeviceOrientation = () => {
    if (!needToAskOrientPermission) {
      return;
    }
    if (
      DeviceOrientationEvent &&
      typeof DeviceOrientationEvent["requestPermission"] === "function"
    ) {
      DeviceOrientationEvent["requestPermission"]()
        .then((response) => {
          if (response == "granted") {
            console.log("deivce permission granted, do nothing");
            setNeedToAskOrientPermission(false);
          } else {
            toast.error(
              "You need to grant permission to the device's orientation to be able to play the game, please refresh the page."
            );
          }
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      console.log("Device motion permission access method not available");
    }
  };

  const renderPlayerNameInput = () => {
    if (deviceType === "mobile") {
      return (
        <>
          <input
            className="large-input"
            type="text"
            placeholder="Player Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            disabled={!!user}
          />
          <br />
        </>
      );
    }
    return null;
  };

  const goToWaitingRoom = () => {
    history.push(waitingRoomPath);
  };

  const connectToRoomMobile = (roomName: string, playerName: string) => {
    props.socket.emit("player-connected", {
      roomName,
      playerName,
      id: user?.uid,
    });

    props.socket.once("player-connected-callback", (data: ISocketCallback) => {
      if (data.status === "error") {
        const { message } = data;
        toast.error(message);
      } else {
        toast.success(data.message);
        props.store.setPlayer(data.data.player);
        goToWaitingRoom();
      }
    });
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
      if (user) {
        connectToRoomMobile(_roomName, _playerName);
        requestDeviceOrientation();
      } else {
        setNotLoggedInModelOpen(true);
      }
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

  const renderNotLoggedInModal = () => {
    return (
      <Modal
        open={notLoggedInModalOpen}
        onClose={() => setNotLoggedInModelOpen(false)}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "75%",
            backgroundColor: "#eeebdf",
            border: "2px solid #000",
            padding: 10,
          }}
        >
          <Typography>
            You are not logged in. To use features such as saving highscore you
            need to be logged in.
          </Typography>
          <br />
          <br />
          {showLoginInModal ? (
            <LoginComponent setPlayerName={setPlayerName} />
          ) : (
            <Button
              variant="contained"
              onClick={() => setShowLoginInModal(true)}
            >
              Login
            </Button>
          )}
          <Button
            onClick={() => {
              connectToRoomMobile(props.store.roomName, playerName);
              requestDeviceOrientation();
            }}
          >
            Continue as a Guest
          </Button>
        </div>
      </Modal>
    );
  };

  if (isTestMode) {
    if (deviceType === "desktop") {
      startRaceTrackTest(props.socket, props.store.gameSettings);
    } else {
      history.push(controlsRoomPath);
    }
    return null;
  }

  return (
    <div>
      {renderNotLoggedInModal()}
      <div className="container">
        <h2 className="center">
          Welcome to <i>Collisio</i>
        </h2>
        <img src={logo} className="image-logo" alt="" />
        <input
          className="large-input"
          type="text"
          placeholder="Room Name"
          value={props.store.roomName}
          onChange={(e) => props.store.setRoomName(e.target.value)}
        />
        <br />

        {renderPlayerNameInput()}

        <button
          className="large-input"
          id="room-name-btn"
          onClick={connectButtonClicked}
        >
          {deviceType === "desktop" ? "Create Room" : "Join Room"}
        </button>
        <br />
        {deviceType === "mobile" && (
          <button style={{ padding: 10 }} onClick={requestDeviceOrientation}>
            Request device orientation
          </button>
        )}
        <br />
        <p>
          Create a room, you and 3 friends connect to that room with your mobile
          phones. But you can also play alone.
        </p>
        <p>Its a car game where your phone is the controller.</p>
        <h3 className="center">Create a room</h3>
        <p>
          Please type in the room name to create a room. Then all the players
          should type in the room name and their name on their mobile device.
        </p>
        <hr />
        <Button
          variant="outlined"
          size="small"
          startIcon={<VideogameAssetIcon />}
        >
          <Link style={{ textDecoration: "none" }} to={howToPlayPagePath}>
            See how to play game.
          </Link>
        </Button>
        <p>This game is in development</p>
        <p>
          On mobile please have your phone in portrait and lock the screen
          switch
        </p>
        <br />
        <Button
          variant="contained"
          startIcon={<SportsScoreIcon />}
          size="small"
        >
          <Link to={highscorePagePath} style={{ textDecoration: "none" }}>
            See Highscores
          </Link>
        </Button>
        <ToastContainer />
      </div>
      <LoginComponent setPlayerName={setPlayerName} />
    </div>
  );
};

export default OneMonitorFrontPage;
