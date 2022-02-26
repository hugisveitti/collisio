import HelpIcon from "@mui/icons-material/Help";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import QRCode from "qrcode";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import { Socket } from "socket.io-client";
import { IUser } from "../../classes/User";
import { checkIfCanStartGame } from "../../functions/validationFunctions";
import vehicleSelectImg from "../../images/how-to-connect/vehicle_select.png";
import { green4, orange2 } from "../../providers/theme";
import {
  mdts_start_game,
  std_start_game_callback,
} from "../../shared-backend/shared-stuff";
import { getSocket, ISocketCallback } from "../../utils/connectSocket";
import { requestDeviceOrientation } from "../../utils/ControlsClasses";
import { getDeviceType, isIphone } from "../../utils/settings";
import BackdropButton from "../button/BackdropButton";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import {
  gameRoomPath,
  getConnectPagePath,
  tournamentPagePath,
} from "../Routes";
import GameSettingsComponent from "../settings/RoomAndGameSettingsContainer";
import VehicleSettingsComponent from "../settings/VehicleSettingsComponent";
import { IStore } from "../store";
import FindActiveTournamentsComponent from "../tournament/inputs/FindActiveTournamentsComponent";
import WaitingRoomPlayerList from "./WaitingRoomPlayerList";

interface IWaitingRoomProps {
  socket: Socket;
  store: IStore;
  user: IUser;
  roomId: string;
}

const WaitingRoomComponent = (props: IWaitingRoomProps) => {
  const [roomQrCode, setRoomQrCode] = useState("");

  const history = useHistory();

  const onMobile = getDeviceType() === "mobile";
  const activeTournamentObvious =
    props.store.previousPage === tournamentPagePath;
  const user = props.user;

  const roomId = props.roomId;
  const socket = getSocket();

  const handleStartGame = () => {
    socket.emit(mdts_start_game);
    socket.once(std_start_game_callback, (response: ISocketCallback) => {
      if (response.status === "success") {
        history.push(gameRoomPath);
      } else {
        toast.error(response.message);
      }
    });
  };

  const connectionRoomHref =
    window.location.origin + getConnectPagePath(roomId);

  useEffect(() => {
    // only generate qr code on desktop
    if (!onMobile) {
      QRCode.toDataURL(connectionRoomHref)
        .then((url) => {
          setRoomQrCode(url);
        })
        .catch((err) => {
          console.log("error generating qr code", err);
        });
    }

    return () => {
      socket.off(std_start_game_callback);
    };
  }, []);

  const { canStartGame, message: startGameMessage } = checkIfCanStartGame(
    props.store
  );

  return (
    <Grid container spacing={3}>
      <Grid item xs={3} md={3} style={{ textAlign: "left" }}>
        <ToFrontPageButton color="white" />
      </Grid>
      <Grid item xs={9} md={6}>
        <Typography variant="h3" className="center">
          Waiting room
        </Typography>
      </Grid>

      <Grid item xs={12} md={3}>
        <Typography variant="h4">
          <span
            style={{
              backgroundColor: green4,
              color: "white",
              position: onMobile ? "relative" : "absolute",
              fontSize: 64,
            }}
          >
            {roomId}
          </span>
        </Typography>
      </Grid>

      {props.store.tournament?.id && (
        <Grid item xs={12}>
          <Typography>
            This game will be registered in the{" "}
            {props.store.tournament.tournamentType} tournament{" "}
            <i>{props.store.tournament.name}</i>
          </Typography>
        </Grid>
      )}

      <Grid item xs={12}>
        <Divider variant="middle" />
      </Grid>

      {!onMobile && (
        <>
          <Grid item xs={12} md={8} lg={9}>
            <p
              style={{ fontSize: 24, backgroundColor: orange2, color: "black" }}
            >
              On your mobile go to collisio.club, press 'Join game' and write in
              the room id:{" "}
              <span
                style={{
                  backgroundColor: green4,
                  color: "white",

                  fontSize: 28,
                }}
              >
                {roomId}
              </span>
            </p>
          </Grid>

          {roomQrCode && (
            <Grid item xs={12} md={4} lg={3}>
              <img src={roomQrCode} alt="" />
            </Grid>
          )}
          <Grid item xs={12}>
            <Divider variant="middle" />
          </Grid>
        </>
      )}
      {activeTournamentObvious && (
        <>
          <Grid item xs={12}>
            <FindActiveTournamentsComponent standOut store={props.store} />
          </Grid>

          <Grid item xs={12}>
            <Divider variant="middle" />
          </Grid>
        </>
      )}
      {(!onMobile || props.store.player?.isLeader) && (
        <React.Fragment>
          <Grid item xs={12}>
            <BackdropButton
              onClick={handleStartGame}
              disabled={!canStartGame}
              color="white"
              center
              width={200}
              style={{
                height: 40,

                textAlign: "center",
                fontSize: 24,
              }}
            >
              Start game
            </BackdropButton>
          </Grid>
          {!canStartGame && (
            <Grid item xs={12}>
              <Typography color="error">{startGameMessage}</Typography>
            </Grid>
          )}
        </React.Fragment>
      )}

      <Grid item xs={12}>
        <Typography variant="h6" component="div">
          Players in room {props.store.roomId}.{" "}
          {props.store.gameSettings.botDifficulty === "none" ? (
            <span>No bot</span>
          ) : (
            <span>Bot difficulty {props.store.gameSettings.botDifficulty}</span>
          )}
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <WaitingRoomPlayerList
          players={props.store.players}
          playerId={props.store.player?.id}
          trackName={props.store.roomSettings.trackName}
          numberOfLaps={props.store.roomSettings.numberOfLaps}
          gameType={props.store.roomSettings.gameType}
          user={user}
        />
      </Grid>

      {(!onMobile || props.store.player?.isLeader) && (
        <GameSettingsComponent store={props.store} />
      )}

      {onMobile ? (
        <Grid item xs={12}>
          <VehicleSettingsComponent
            store={props.store}
            user={user}
            notInGame
            previewVehicle
            resetOrientation={() => {
              requestDeviceOrientation((permissionGranted, message) => {
                if (permissionGranted) {
                  //   toast.success(message);
                } else {
                  toast.error(message);
                }
              });
            }}
          />
        </Grid>
      ) : (
        <Grid item xs={12}>
          <div className="background">
            <Typography>
              You can change vehicles on your phone. You need to be logged in on
              your phone!{" "}
            </Typography>
          </div>
          <img src={vehicleSelectImg} style={{ width: 300 }} alt="" />
        </Grid>
      )}

      <Grid item xs={12}></Grid>
      {!activeTournamentObvious && (
        <Grid item xs={12}>
          <FindActiveTournamentsComponent store={props.store} />
        </Grid>
      )}

      {onMobile && isIphone() && (
        <React.Fragment>
          <Grid item xs={6} sm={6}>
            <Tooltip title="To activate the device orientation on iphone the user sometimes needs to press a button to request it. For development purposes this button is here.">
              <Button startIcon={<HelpIcon />}>What is this</Button>
            </Tooltip>
          </Grid>
          <Grid item xs={6} sm={6}>
            <Button
              variant="outlined"
              onClick={() =>
                requestDeviceOrientation((permissionGranted, message) => {
                  if (permissionGranted) {
                    //   toast.success(message);
                  } else {
                    toast.error(message);
                  }
                })
              }
            >
              Request device orientation
            </Button>
          </Grid>
        </React.Fragment>
      )}
    </Grid>
  );
};

export default WaitingRoomComponent;
