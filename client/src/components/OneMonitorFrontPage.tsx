import SportsScoreIcon from "@mui/icons-material/SportsScore";
import HelpIcon from "@mui/icons-material/Help";
import VideogameAssetIcon from "@mui/icons-material/VideogameAsset";
import {
  Button,
  Divider,
  Grid,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
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
import NotLoggedInModal from "./NotLoggedInModal";

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
    if (user?.displayName) {
      setPlayerName(user.displayName);
    }
  }, [user]);

  useEffect(() => {
    if (startGameAuto) {
      props.store.setRoomId("testRoom");
      setPlayerName("testPlayer");
      setTimeout(() => {
        connectButtonClicked();
      }, 100);
    }
    if (isTestMode) {
      if (deviceType === "desktop") {
        startRaceTrackTest(props.socket, props.store.gameSettings);
      } else {
        history.push(controlsRoomPath);
      }
    }
    if (deviceType === "desktop") {
      setNeedToAskOrientPermission(false);
    } else {
      window.addEventListener(
        "deviceorientation",
        checkIfNeedOrientaitonPrompt
      );
    }
  }, []);

  if (isTestMode) {
    return null;
  }

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

  const goToWaitingRoom = () => {
    console.log("go to waiting room", history, waitingRoomPath);
    history.push(waitingRoomPath);
  };

  const connectToRoomMobile = (roomId: string, playerName: string) => {
    props.socket.emit("player-connected", {
      roomId,
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

  const createRoomDesktop = (roomId: string) => {
    props.socket.emit("create-room", { roomId });
    props.socket.once("create-room-callback", (response: ISocketCallback) => {
      console.log("room created callback", response);
      if (response.status === "success") {
        const { roomId } = response.data;
        props.store.setRoomId(roomId);
        goToWaitingRoom();
      } else {
        toast.error(response.message);
      }
    });
  };

  const connectButtonClicked = () => {
    console.log("connect button clicked");
    let _roomId: string, _playerName: string;
    if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
      _roomId = props.store.roomId !== "" ? props.store.roomId : "testRoom";
      _playerName = playerName !== "" ? playerName : "testPlayer";
    } else {
      _playerName = playerName;
      _roomId = props.store.roomId;
    }
    if (deviceType === "desktop") {
      createRoomDesktop(_roomId);
    } else {
      if (user) {
        connectToRoomMobile(_roomId, _playerName);
        requestDeviceOrientation();
      } else {
        setNotLoggedInModelOpen(true);
      }
    }
  };

  return (
    <div>
      <NotLoggedInModal
        open={notLoggedInModalOpen}
        onClose={() => setNotLoggedInModelOpen(false)}
        infoText="You are not logged in. To use features such as saving highscore you
need to be logged in."
        onContinoueAsGuest={() => {
          connectToRoomMobile(props.store.roomId, playerName);
          requestDeviceOrientation();
        }}
      />
      <div className="container">
        <Grid container spacing={5}>
          <Grid item xs={12}>
            <h2 className="center">
              Welcome to <i>Collisio</i>
            </h2>
          </Grid>
          <Grid item xs={12}>
            <img src={logo} className="image-logo" alt="" />
          </Grid>

          {deviceType === "mobile" && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Player Name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  disabled={!!user}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Room id"
                  value={props.store.roomId}
                  onChange={(e) => props.store.setRoomId(e.target.value)}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Button
              onClick={connectButtonClicked}
              variant="contained"
              size="large"
              startIcon={<VideogameAssetIcon />}
            >
              {deviceType === "desktop" ? "Start Game" : "Join Room"}
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Typography color="gray">
              Create a room, you and 3 friends connect to that room with your
              mobile phones. But you can also play alone.
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <p>Its a car game where your phone is the controller.</p>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Divider variant="middle" />
          </Grid>
          <Grid item xs={12}>
            <Button variant="outlined" size="small" startIcon={<HelpIcon />}>
              <Link style={{ textDecoration: "none" }} to={howToPlayPagePath}>
                See how to play game.
              </Link>
            </Button>
          </Grid>
        </Grid>
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
