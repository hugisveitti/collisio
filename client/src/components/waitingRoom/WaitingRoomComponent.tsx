import {
  Avatar,
  Button,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import QRCode from "qrcode";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import HelpIcon from "@mui/icons-material/Help";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Socket } from "socket.io-client";
import FaceIcon from "@mui/icons-material/Face";

import { IPlayerInfo } from "../../classes/Game";
import { inputBackgroundColor } from "../../providers/theme";
import { ISocketCallback } from "../../utils/connectSocket";
import { requestDeviceOrientation } from "../../utils/ControlsClasses";
import {
  getDeviceType,
  isIphone,
  isMobileTestMode,
  startGameAuto,
} from "../../utils/settings";
import GameSettingsComponent from "../GameSettingsComponent";
import { frontPagePath, gameRoomPath } from "../Routes";
import { IStore } from "../store";
import { IUser } from "../../firebase/firebaseFunctions";

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

  const sendPlayerInfoChanged = (newPlayerInfo: IPlayerInfo) => {
    props.socket.emit("player-info-change", newPlayerInfo);
  };

  const handleStartGame = () => {
    props.socket.emit("handle-start-game");
    props.socket.once("handle-start-game-callback", (data: ISocketCallback) => {
      if (data.status === "success") {
        history.push(gameRoomPath);
      } else {
        toast.error(data.message);
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

    if (isMobileTestMode) {
      if (onMobile) {
        sendPlayerInfoChanged(props.store.player);
      }
    }
    return () => {
      props.socket.off("handle-start-game-callback");
    };
  }, []);

  useEffect(() => {
    /***** For development */
    if (startGameAuto) {
      if (props.store.players.length > 0) {
        handleStartGame();
      }
    }
    if (isMobileTestMode && !onMobile) {
      if (props.store.players.length > 0) {
        handleStartGame();
      }
    }
    /****** */
  }, [props.store.players]);

  const renderTeamSelect = (player: IPlayerInfo, i: number) => {
    if (props.store.gameSettings.typeOfGame !== "ball") return null;
    if (onMobile && props.store.player?.playerNumber === player.playerNumber) {
      return (
        <div className="team-select-container">
          <label className="team-select-radio-button">
            <input
              type="radio"
              id="team0"
              name={`team-pick-${i}`}
              value={0}
              checked={player.teamNumber === 0}
              onChange={() => {
                const newPayerInfo = {
                  ...props.store.player,
                  teamNumber: 0,
                } as IPlayerInfo;
                props.store.setPlayer(newPayerInfo);
                sendPlayerInfoChanged(newPayerInfo);
              }}
            />
            Team 0
          </label>
          <label className="team-select-radio-button">
            <input
              type="radio"
              id="team1"
              name={`team-pick-${i}`}
              value={1}
              checked={player.teamNumber === 1}
              onChange={() => {
                const newPayerInfo = {
                  ...props.store.player,
                  teamNumber: 1,
                } as IPlayerInfo;
                props.store.setPlayer(newPayerInfo);
                sendPlayerInfoChanged(newPayerInfo);
              }}
            />
            Team 1
          </label>
        </div>
      );
    }
    return (
      <span className="team-select-container">TEAM: {player.teamNumber}</span>
    );
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <h1 className="center">Waiting room</h1>
      </Grid>
      <Grid item xs={12}>
        <h3>{roomId}</h3>
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
          You can press 'r' to reset the game and 'p' to pause and unpause the
          game.
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <h3 className="center">Players in room {props.store.roomId}</h3>
      </Grid>

      <React.Fragment>
        <Grid item xs={1} sm={3} />
        {props.store.players.length > 0 ? (
          <Grid item xs={10} sm={6}>
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
                          <FaceIcon />
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
                      {renderTeamSelect(player, i)}
                    </ListItem>
                    {i !== props.store.players.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </Grid>
        ) : (
          <Grid item xs={10} sm={6}>
            <Typography
              style={{
                backgroundColor: "wheat",
              }}
            >
              No players connected
            </Typography>
          </Grid>
        )}
        <Grid item xs={1} sm={3} />
      </React.Fragment>

      {!onMobile && (
        <React.Fragment>
          <Grid item xs={12}>
            <Button variant="contained" onClick={handleStartGame}>
              Start game
            </Button>
          </Grid>
          <Divider variant="middle" style={{ margin: 15 }} />
          <GameSettingsComponent socket={props.socket} store={props.store} />
        </React.Fragment>
      )}
      {onMobile && (
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel id="vehicle-select">Vehicle</InputLabel>
            <Select
              style={{
                backgroundColor: inputBackgroundColor,
              }}
              label="Vehicle selection"
              name="vehicle"
              onChange={(e) => {
                if (!user) {
                  toast.error("You have to log in to change vehicles");
                } else {
                  const newPayerInfo = {
                    ...props.store.player,
                    vehicleType: e.target.value,
                  } as IPlayerInfo;
                  props.store.setPlayer(newPayerInfo);
                  sendPlayerInfoChanged(newPayerInfo);
                }
              }}
              value={props.store.player.vehicleType}
            >
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="tractor">Tractor</MenuItem>
              <MenuItem value="f1">F1 car</MenuItem>
            </Select>
          </FormControl>
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
              onClick={() => requestDeviceOrientation()}
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
