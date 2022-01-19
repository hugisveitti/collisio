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
import { IUser, IVehicleSettings } from "../../classes/User";
import { setDBUserSettings } from "../../firebase/firestoreFunctions";
import { checkIfCanStartGame } from "../../functions/validationFunctions";
import { green4 } from "../../providers/theme";
import { std_start_game_callback } from "../../shared-backend/shared-stuff";
import { ISocketCallback } from "../../utils/connectSocket";
import { requestDeviceOrientation } from "../../utils/ControlsClasses";
import { getDeviceType, isIphone } from "../../utils/settings";
import { socketHandleStartGame } from "../../utils/socketFunctions";
import BackdropButton from "../backdrop/button/BackdropButton";
import CopyTextButton from "../inputs/CopyTextButton";
import FullscreenButton from "../inputs/FullscreenButton";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import { gameRoomPath, tournamentPagePath } from "../Routes";
import GameSettingsComponent from "../settings/GameSettingsContainer";
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

  const handleStartGame = () => {
    socketHandleStartGame(props.store.socket, (response: ISocketCallback) => {
      if (response.status === "success") {
        history.push(gameRoomPath);
      } else {
        toast.error(response.message);
      }
    });
  };

  useEffect(() => {
    // only generate qr code on desktop
    if (!onMobile) {
      QRCode.toDataURL(window.location.href)
        .then((url) => {
          setRoomQrCode(url);
        })
        .catch((err) => {
          console.log("error generating qr code", err);
        });
    }

    return () => {
      props.store.socket.off(std_start_game_callback);
    };
  }, []);

  const { canStartGame, message: startGameMessage } = checkIfCanStartGame(
    props.store
  );

  return (
    <Grid container spacing={3}>
      <Grid item xs={1} lg={2} style={{ textAlign: "left" }}>
        <FullscreenButton />
      </Grid>
      <Grid item xs={10} lg={4}>
        <Typography variant="h3" className="center">
          Waiting room
        </Typography>
      </Grid>
      <Grid item xs={1} lg={false}></Grid>
      {props.store.tournament?.id && (
        <Grid item xs={12}>
          <Typography>
            This game will be registered in the{" "}
            {props.store.tournament.tournamentType} tournament{" "}
            <i>{props.store.tournament.name}</i>
          </Typography>
        </Grid>
      )}
      <Grid item xs={12} lg={4}>
        <Typography variant="h4">
          <span style={{ backgroundColor: green4, color: "white" }}>
            {roomId}
          </span>
        </Typography>
      </Grid>
      <Grid item xs={12} lg={2}>
        <ToFrontPageButton />
      </Grid>

      <Grid item xs={12}>
        <Divider variant="middle" />
      </Grid>

      {!onMobile && (
        <>
          <Grid item xs={12} lg={3}>
            <Typography>
              On your mobile, either scan the QR code, copy the link to room and
              paste it in your phone or write the room id '{roomId}' in input on
              the front page.
            </Typography>
          </Grid>

          <Grid item xs={12} lg={3}>
            <Typography color="#eee">
              You can press 'esc' to pause the game and open the settings.
            </Typography>
          </Grid>

          <Grid item xs={12} lg={3}>
            <CopyTextButton
              infoText={`Link to room: ${window.location.href}`}
              copyText={window.location.href}
            />
          </Grid>

          {roomQrCode && (
            <Grid item xs={12} lg={3}>
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

      <Grid item xs={12}>
        <Typography variant="h6" component="div">
          Players in room {props.store.roomId}
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <WaitingRoomPlayerList
          players={props.store.players}
          playerId={props.store.player?.id}
          trackName={props.store.gameSettings.trackName}
          numberOfLaps={props.store.gameSettings.numberOfLaps}
          gameType={props.store.gameSettings.gameType}
          user={user}
        />
      </Grid>

      {(!onMobile || props.store.player?.isLeader) && (
        <React.Fragment>
          <Grid item xs={12}>
            <BackdropButton onClick={handleStartGame} disabled={!canStartGame}>
              Start game
            </BackdropButton>
          </Grid>
          {!canStartGame && (
            <Grid item xs={12}>
              <Typography color="error">{startGameMessage}</Typography>
            </Grid>
          )}

          <GameSettingsComponent store={props.store} />
        </React.Fragment>
      )}
      {/* {onMobile && (
        <Grid item xs={12}>
          <VehicleSelect
            disabled={!!props.store.tournament?.vehicleType}
            onChange={(vehicleType) => {
              if (!user) {
                toast.error("You have to log in to change vehicles");
              } else {
                const newPayerInfo = {
                  ...props.store.player,
                  vehicleType,
                } as IPlayerInfo;
                props.store.setPlayer(newPayerInfo);
                sendPlayerInfoChanged(props.store.socket, newPayerInfo);

                updateUserVehicleSettings(
                  "vehicleType",
                  vehicleType as VehicleType
                );
              }
            }}
            value={
              !!props.store.tournament?.vehicleType
                ? props.store.tournament?.vehicleType
                : props.store.player.vehicleType
            }
            previewVehicle
            excludedVehicles={nonactiveVehcileTypes}
          />
        </Grid>
      )} */}

      {onMobile && (
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
