import HelpIcon from "@mui/icons-material/Help";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import VideogameAssetIcon from "@mui/icons-material/VideogameAsset";
import { Button, Divider, Grid, TextField, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Socket } from "socket.io-client";
import { v4 as uuid } from "uuid";
import { IPlayerConnection } from "../classes/Game";
import AppContainer from "../containers/AppContainer";
import logo from "../images/caroutline.png";
import { inputBackgroundColor, themeOptions } from "../providers/theme";
import { UserContext } from "../providers/UserProvider";
import "../styles/main.css";
import { startLowPolyTest } from "../test-courses/lowPolyTest";
import { ISocketCallback } from "../utils/connectSocket";
import { IDeviceOrientationEvent } from "../utils/ControlsClasses";
import { getDeviceType, isTestMode, startGameAuto } from "../utils/settings";
import NotLoggedInModal from "./NotLoggedInModal";
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

const useStyles = makeStyles({
  container: {
    padding: 25,
    marginTop: 0,
    backgroundColor: themeOptions.palette.secondary.dark,
  },
  input: {
    backgroundColor: themeOptions.palette.secondary.light,
  },
});

const OneMonitorFrontPage = (props: IOneMonitorFrontPageProps) => {
  const deviceType = getDeviceType();
  const classes = useStyles();
  const [playerName, setPlayerName] = useState("");
  const [needToAskOrientPermission, setNeedToAskOrientPermission] =
    useState(true);

  const [notLoggedInModalOpen, setNotLoggedInModelOpen] = useState(false);
  const [showLoginInModal, setShowLoginInModal] = useState(false);
  const history = useHistory();

  const user = useContext(UserContext);

  const checkIfNeedOrientaitonPrompt = (e: IDeviceOrientationEvent) => {
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
    /** Just for development  */
    if (startGameAuto) {
      props.store.setRoomId("testRoom");
      setPlayerName("testPlayer");
      setTimeout(() => {
        connectButtonClicked();
      }, 100);
    }
    if (isTestMode) {
      if (deviceType === "desktop") {
        startLowPolyTest(props.socket, props.store.gameSettings);
        // startRaceTrackTest(props.socket, props.store.gameSettings);
      } else {
        history.push(controlsRoomPath);
      }
    }
    /**************** */

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

    // I think it is only needed for iphones
    if (
      navigator.userAgent.toLowerCase().includes("iphone") &&
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

  const goToWaitingRoom = (roomId: string) => {
    history.push(waitingRoomPath + "/" + roomId);
  };

  const connectToRoomMobile = (roomId: string, playerName: string) => {
    props.socket.emit("player-connected", {
      roomId,
      playerName,
      playerId: user?.uid ?? uuid(),
      isAuthenticated: Boolean(user),
    } as IPlayerConnection);

    props.socket.once("player-connected-callback", (data: ISocketCallback) => {
      if (data.status === "error") {
        const { message } = data;
        toast.error(message);
      } else {
        toast.success(data.message);
        props.store.setPlayer(data.data.player);
        goToWaitingRoom(roomId);
      }
    });
  };

  const createRoomDesktop = (roomId: string) => {
    props.socket.emit("create-room", { roomId });
    props.socket.once("create-room-callback", (response: ISocketCallback) => {
      if (response.status === "success") {
        const { roomId } = response.data;
        props.store.setRoomId(roomId);
        goToWaitingRoom(roomId);
      } else {
        toast.error(response.message);
      }
    });
  };

  const connectButtonClicked = () => {
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
    <AppContainer>
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
          <Grid item xs={12}>
            <h3>
              Important! If you are using an iphone you will probably need to
              use the Google Chrome browser for the game to function properly.
            </h3>
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
                  className={classes.input}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  style={{
                    backgroundColor: inputBackgroundColor,
                  }}
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
              {deviceType === "desktop" ? "Create a Game" : "Join a Game"}
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Typography color="gray">
              Create a room, you and 3 friends connect to that room with your
              mobile phones. You can also play singleplayer and compete againt
              highscores.
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <p>
              A car game where your phone is the controller. No installations,
              no fuss, just a desktop browser and a smartphone browser.
            </p>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Divider variant="middle" />
          </Grid>
          <Grid item xs={false} sm={1} lg={4} xl={4} />
          <Grid item xs={12} sm={5} lg={2} xl={2}>
            <Link style={{ textDecoration: "none" }} to={howToPlayPagePath}>
              <Button variant="contained" size="small" startIcon={<HelpIcon />}>
                How to play game
              </Button>
            </Link>
          </Grid>
          <Grid item xs={12} sm={5} lg={2} xl={2}>
            <Link to={highscorePagePath} style={{ textDecoration: "none" }}>
              <Button
                variant="contained"
                startIcon={<SportsScoreIcon />}
                size="small"
              >
                Highscores
              </Button>
            </Link>
          </Grid>
          <Grid item xs={false} sm={1} lg={4} xl={4} />
          <Grid item xs={12}>
            <p>
              This game is in development. If you have suggestions please email
              hugiholm1 [at] gmail.com
            </p>
          </Grid>
        </Grid>
        <ToastContainer />
      </div>
    </AppContainer>
  );
};

export default OneMonitorFrontPage;
