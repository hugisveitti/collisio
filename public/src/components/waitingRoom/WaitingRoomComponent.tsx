import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FaceIcon from "@mui/icons-material/Face";
import HelpIcon from "@mui/icons-material/Help";
import {
  Avatar,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Radio,
  RadioGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import QRCode from "qrcode";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Socket } from "socket.io-client";
import { IRoomInfo } from "../../classes/Game";
import { IVehicleSettings } from "../../classes/User";
import {
  IUser,
  saveRoom,
  setDBUserSettings,
} from "../../firebase/firebaseFunctions";
import {
  IPlayerInfo,
  playerInfoToPreGamePlayerInfo,
  VehicleType,
} from "../../shared-backend/shared-stuff";
import { ISocketCallback } from "../../utils/connectSocket";
import { requestDeviceOrientation } from "../../utils/ControlsClasses";
import { getDeviceType, isIphone } from "../../utils/settings";
import {
  sendPlayerInfoChanged,
  socketHandleStartGame,
} from "../../utils/socketFunctions";
import {
  getVehicleNameFromType,
  nonactiveVehcileTypes,
} from "../../vehicles/VehicleConfigs";
import VehicleSelect from "../inputs/VehicleSelect";
import { frontPagePath, gameRoomPath } from "../Routes";
import { IStore } from "../store";
import PreGameSettingsComponent from "./PreGameSettingsComponent";

interface IWaitingRoomProps {
  socket: Socket;
  store: IStore;
  user: IUser;
  roomId: string;
}

const WaitingRoomComponent = (props: IWaitingRoomProps) => {
  const [roomQrCode, setRoomQrCode] = useState("");
  const [copyTooltipOpen, setCopyTooltipOpen] = useState(false);

  const history = useHistory();

  const onMobile = getDeviceType() === "mobile";
  const user = props.user;

  const roomId = props.roomId;

  const handleStartGame = () => {
    socketHandleStartGame(props.socket, (response: ISocketCallback) => {
      if (response.status === "success") {
        const roomInfo: IRoomInfo = {
          desktopId: user?.uid,
          desktopAuthenticated: !!user,
          roomId: props.roomId,
          preGameSettings: props.store.preGameSettings,
          players: props.store.players.map(playerInfoToPreGamePlayerInfo),
          date: new Date(),
        };
        saveRoom(props.roomId, roomInfo);

        history.push(gameRoomPath);
      } else {
        toast.error(response.message);
      }
    });
  };

  useEffect(() => {
    // only generate qr code on desktop
    QRCode.toDataURL(window.location.href)
      .then((url) => {
        setRoomQrCode(url);
      })
      .catch((err) => {
        console.log("error generating qr code", err);
      });

    return () => {
      props.socket.off("handle-start-game-callback");
    };
  }, []);

  const updateUserVehicleSettings = (
    key: keyof IVehicleSettings,
    value: any
  ) => {
    const newVehcileSettings = props.store.userSettings.vehicleSettings;
    // @ts-ignore
    newVehcileSettings[key] = value;

    const newUserSettings = {
      ...props.store.userSettings,
      vehicleSettings: newVehcileSettings,
    };

    props.store.setUserSettings(newUserSettings);

    if (user?.uid) {
      setDBUserSettings(user.uid, newUserSettings);
    }
  };

  const renderTeamSelect = (player: IPlayerInfo, i: number) => {
    if (props.store.preGameSettings.gameType !== "ball") return null;
    if (onMobile && props.store.player?.playerNumber === player.playerNumber) {
      return (
        <ListItemText>
          <FormControl>
            <FormLabel component="legend">Team</FormLabel>
            <RadioGroup
              defaultValue={1}
              onChange={(e, val) => {
                const newPlayerInfo: IPlayerInfo = {
                  ...props.store.player,
                  teamNumber: +val,
                  teamName: val,
                };

                props.store.setPlayer(newPlayerInfo);

                sendPlayerInfoChanged(props.socket, newPlayerInfo);
              }}
            >
              <FormControlLabel label="0" value={0} control={<Radio />} />
              <FormControlLabel label="1" value={1} control={<Radio />} />
            </RadioGroup>
          </FormControl>
        </ListItemText>
      );
    }
    return <ListItemText primary={`Team ${player.teamNumber}`} />;
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <h1 className="center">Waiting room</h1>
      </Grid>
      <Grid item xs={12}>
        <h2>{roomId}</h2>
      </Grid>
      <Grid item xs={12}>
        <Link to={frontPagePath}>Back to front page</Link>
      </Grid>
      <Grid item xs={12}>
        <Typography component="span">
          Link to room: {window.location.href}
        </Typography>{" "}
        <Tooltip
          title="Link copied!"
          arrow
          placement="top"
          open={copyTooltipOpen}
          disableFocusListener
          disableHoverListener
          disableTouchListener
          onClose={() => setCopyTooltipOpen(false)}
        >
          <IconButton
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setCopyTooltipOpen(true);
              setTimeout(() => {
                setCopyTooltipOpen(false);
              }, 2000);
            }}
          >
            <ContentCopyIcon />
          </IconButton>
        </Tooltip>
      </Grid>
      {roomQrCode && (
        <Grid item xs={12}>
          <img src={roomQrCode} alt="" />
        </Grid>
      )}

      <Grid item xs={12}>
        <Typography>
          On your mobile, either scan the QR code, copy the link to room and
          paste it in your phone or write the room id '{roomId}' in input on the
          front page.
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Typography color="textSecondary">
          You can press 'esc' to pause the game and open the settings.
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <h3 className="center">Players in room {props.store.roomId}</h3>
      </Grid>

      <React.Fragment>
        <Grid item xs={1} sm={2} />
        {props.store.players.length > 0 ? (
          <Grid item xs={10} sm={8}>
            <List
              style={{
                backgroundColor: "wheat",
              }}
            >
              {props.store.players.map((player: IPlayerInfo, i: number) => {
                return (
                  <React.Fragment key={player.playerName}>
                    <ListItem>
                      <ListItemAvatar>
                        {player.photoURL ? (
                          <Avatar
                            alt={player.playerName}
                            src={player.photoURL}
                          />
                        ) : (
                          <FaceIcon fontSize="large" />
                        )}
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          player.playerNumber ===
                          props.store.player?.playerNumber ? (
                            <strong>{player.playerName}</strong>
                          ) : (
                            player.playerName
                          )
                        }
                      />
                      <ListItemText
                        primary={getVehicleNameFromType(player.vehicleType)}
                      />

                      {renderTeamSelect(player, i)}
                    </ListItem>
                    {i !== props.store.players.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </Grid>
        ) : (
          <Grid item xs={10} sm={8}>
            <Typography
              style={{
                backgroundColor: "wheat",
              }}
            >
              No players connected
            </Typography>
          </Grid>
        )}
        <Grid item xs={1} sm={2} />
      </React.Fragment>

      {!onMobile && (
        <React.Fragment>
          <Grid item xs={12}>
            <Button variant="contained" onClick={handleStartGame}>
              Start game
            </Button>
          </Grid>
          <Divider variant="middle" style={{ margin: 15 }} />
          <PreGameSettingsComponent
            socket={props.socket}
            store={props.store}
            userId={user?.uid}
          />
        </React.Fragment>
      )}
      {onMobile && (
        <Grid item xs={12}>
          <VehicleSelect
            onChange={(vehicleType) => {
              if (!user) {
                toast.error("You have to log in to change vehicles");
              } else {
                const newPayerInfo = {
                  ...props.store.player,
                  vehicleType,
                } as IPlayerInfo;
                props.store.setPlayer(newPayerInfo);
                sendPlayerInfoChanged(props.socket, newPayerInfo);

                updateUserVehicleSettings(
                  "vehicleType",
                  vehicleType as VehicleType
                );
              }
            }}
            value={props.store.player.vehicleType}
            previewVehicle
            excludedVehicles={nonactiveVehcileTypes}
          />
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
                    toast.success(message);
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
