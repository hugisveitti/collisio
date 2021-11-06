import HelpIcon from "@mui/icons-material/Help";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import VideogameAssetIcon from "@mui/icons-material/VideogameAsset";
import { Button, Divider, Grid, TextField, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Socket } from "socket.io-client";
import { v4 as uuid } from "uuid";
import { IPlayerConnection } from "../classes/Game";
import AppContainer from "../containers/AppContainer";
import logo from "../images/caroutline.png";
import { inputBackgroundColor, themeOptions } from "../providers/theme";
import { UserContext } from "../providers/UserProvider";
import "../styles/main.css";
import { ISocketCallback } from "../utils/connectSocket";
import { IDeviceOrientationEvent } from "../utils/ControlsClasses";
import { getDeviceType } from "../utils/settings";
import AvailableRoomsComponent from "./AvailableRoomsComponent";
import DonateButton from "./DonateButton";
import NotLoggedInModal from "./NotLoggedInModal";
import {
  highscorePagePath,
  howToPlayPagePath,
  waitingRoomPath,
} from "./Routes";
import { IStore } from "./store";

interface FrontPageProps {
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

const FrontPage = (props: FrontPageProps) => {
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

  const handleRequestDeviceOrientation = () => {
    if (!needToAskOrientPermission) {
      return;
    }
    setNeedToAskOrientPermission(false);
  };

  const goToWaitingRoom = (roomId: string) => {
    history.push(waitingRoomPath + "/" + roomId);
  };

  const createPlayerConnectedCallback = () => {
    props.socket.once(
      "player-connected-callback",
      (response: ISocketCallback) => {
        console.log("player conn res", response);
        if (response.status === "error") {
          const { message } = response;
          toast.error(message);
        } else {
          toast.success(response.message);
          props.store.setPlayer(response.data.player);
          goToWaitingRoom(response.data.roomId);
        }
      }
    );
  };

  const connectToRoomMobile = (roomId: string, playerName: string) => {
    props.socket.emit("player-connected", {
      roomId: roomId.toLowerCase(),
      playerName,
      playerId: user?.uid ?? uuid(),
      isAuthenticated: Boolean(user),
      photoURL: user?.photoURL,
    } as IPlayerConnection);

    createPlayerConnectedCallback();
  };

  const createRoomDesktopCallback = () => {
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

  const createRoomDesktop = (roomId: string) => {
    props.socket.emit("create-room", { roomId });
    createRoomDesktopCallback();
  };

  const connectButtonClicked = (roomId: string) => {
    if (deviceType === "desktop") {
      createRoomDesktop(roomId);
    } else {
      if (user) {
        connectToRoomMobile(roomId, playerName);
        handleRequestDeviceOrientation();
      } else {
        setNotLoggedInModelOpen(true);
      }
    }
  };

  useEffect(() => {
    if (user?.displayName) {
      setPlayerName(user.displayName);
    }
  }, [user]);

  useEffect(() => {
    if (deviceType === "desktop") {
      setNeedToAskOrientPermission(false);
    } else {
      window.addEventListener(
        "deviceorientation",
        checkIfNeedOrientaitonPrompt
      );
    }

    return () => {
      props.socket.off("player-connected-callback");
    };
  }, []);

  return (
    <AppContainer>
      <NotLoggedInModal
        open={notLoggedInModalOpen}
        onClose={() => setNotLoggedInModelOpen(false)}
        infoText="You are not logged in. To use features such as saving highscore you
need to be logged in."
        onContinoueAsGuest={() => {
          connectToRoomMobile(props.store.roomId, playerName);
          handleRequestDeviceOrientation();
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
              {user && (
                <Grid item xs={12} sm={12}>
                  <AvailableRoomsComponent
                    store={props.store}
                    connectButtonClicked={connectButtonClicked}
                    userId={user.uid}
                  />
                </Grid>
              )}
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
              onClick={() => connectButtonClicked(props.store.roomId)}
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
              hugiholm1 [a] [t] gmail.com
            </p>
          </Grid>
          <Grid item xs={12}>
            <Typography>
              Currently I am a single developer running this project. If you
              wish to donate to the project and help it grow, that would be
              greatly appreciated.
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <DonateButton />
          </Grid>
        </Grid>
      </div>
    </AppContainer>
  );
};

export default FrontPage;
