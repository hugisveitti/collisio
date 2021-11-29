import HelpIcon from "@mui/icons-material/Help";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import VideogameAssetIcon from "@mui/icons-material/VideogameAsset";

import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import { Socket } from "socket.io-client";
import { v4 as uuid } from "uuid";
import { IPlayerConnection } from "../classes/Game";
import AppContainer from "../containers/AppContainer";
import { inputBackgroundColor } from "../providers/theme";
import { UserContext } from "../providers/UserProvider";
import {
  dts_create_room,
  mts_player_connected,
  std_room_created_callback,
  stm_player_connected_callback,
} from "../shared-backend/shared-stuff";
import "../styles/main.css";
import { ISocketCallback } from "../utils/connectSocket";
import { IDeviceOrientationEvent } from "../utils/ControlsClasses";
import { getDeviceType } from "../utils/settings";
import AvailableRoomsComponent from "./AvailableRoomsComponent";
import NotLoggedInModal from "./NotLoggedInModal";
import {
  highscorePagePath,
  howToPlayPagePath,
  waitingRoomPath,
} from "./Routes";
import { IStore } from "./store";
import logo from "../images/collisio-logo.png";
import AdSense from "./monitary/AdSense";

interface FrontPageProps {
  socket: Socket;
  store: IStore;
}

const FrontPage = (props: FrontPageProps) => {
  const deviceType = getDeviceType();

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
      stm_player_connected_callback,
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
    console.log("connect to room mobile");
    props.socket.emit(mts_player_connected, {
      roomId: roomId.toLowerCase(),
      playerName,
      playerId: user?.uid ?? uuid(),
      isAuthenticated: Boolean(user),
      photoURL: user?.photoURL,
    } as IPlayerConnection);

    createPlayerConnectedCallback();
  };

  const createRoomDesktopCallback = () => {
    props.socket.once(
      std_room_created_callback,
      (response: ISocketCallback) => {
        if (response.status === "success") {
          const { roomId } = response.data;
          props.store.setRoomId(roomId);
          goToWaitingRoom(roomId);
        } else {
          toast.error(response.message);
        }
      }
    );
  };

  const createRoomDesktop = () => {
    props.socket.emit(dts_create_room, {});
    createRoomDesktopCallback();
  };

  // need the roomId for the mobile
  const connectButtonClicked = (roomId: string) => {
    if (deviceType === "desktop") {
      createRoomDesktop();
    } else {
      if (playerName.length === 0) {
        toast.error("Player name cannot be empty");
        return;
      }
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
      props.socket.off(stm_player_connected_callback);
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
      <Grid container spacing={5}>
        <Grid item xs={12}>
          <Typography variant="h3" component="div" gutterBottom>
            Welcome to
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <img src={logo} style={{ width: 400, maxWidth: "80%" }} alt="" />
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
                style={{
                  backgroundColor: inputBackgroundColor,
                }}
                label="Player Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                disabled={!!user}
                fullWidth
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
            Create a room, you and upto 3 friends connect to that room with your
            mobile phones. You can also play singleplayer and compete againt
            highscores.
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Typography>
            A car game where your phone is the controller. No installations, no
            fuss, just a desktop browser and a smartphone browser.
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <AdSense slotId="7059022973" />
        </Grid>

        <Grid item xs={12}>
          <Divider variant="middle" />
        </Grid>
        <Grid item xs={false} sm={1} lg={4} xl={4} />
        <Grid item xs={12} sm={5} lg={2} xl={2}>
          <Link style={{ textDecoration: "none" }} to={howToPlayPagePath}>
            <Button
              disableElevation
              variant="contained"
              size="small"
              startIcon={<HelpIcon />}
            >
              How to play game
            </Button>
          </Link>
        </Grid>
        <Grid item xs={12} sm={5} lg={2} xl={2}>
          <Link to={highscorePagePath} style={{ textDecoration: "none" }}>
            <Button
              disableElevation
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
          <Typography>
            This game is in development. If you have suggestions please email
            hugiholm1 [a] [t] gmail.com
          </Typography>
        </Grid>
      </Grid>
    </AppContainer>
  );
};

export default FrontPage;
