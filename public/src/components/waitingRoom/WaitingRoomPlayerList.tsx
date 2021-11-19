import {
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  Grid,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { getTrackNameFromType } from "../../classes/Game";
import {
  getPlayerBestScoreOnTrackAndLap,
  playerGameDataRefPath,
} from "../../firebase/firebaseFunctions";
import { viewBottoms, viewLefts } from "../../game/GameScene";
import {
  GameType,
  IPlayerInfo,
  TrackName,
} from "../../shared-backend/shared-stuff";
import { getDeviceType } from "../../utils/settings";
import { getVehicleNameFromType } from "../../vehicles/VehicleConfigs";

interface IWaitingRoomPlayerItem {
  player: IPlayerInfo;
  isUser: boolean;
  trackName: TrackName;
  numberOfLaps: number;
  gameType: GameType;
}

const onDesktop = getDeviceType() !== "mobile";

const WaitingRoomPlayerItem = (props: IWaitingRoomPlayerItem) => {
  const [personalBest, setPersonalBest] = useState(-1);

  useEffect(() => {
    if (props.gameType === "race" && onDesktop) {
      getPlayerBestScoreOnTrackAndLap(
        props.player.id,
        props.trackName,
        props.numberOfLaps,
        (personalBest) => {
          if (personalBest.totalTime) {
            setPersonalBest(personalBest.totalTime);
          } else {
            setPersonalBest(-1);
          }
        }
      );
    }
  }, [props.trackName, props.numberOfLaps]);

  const renderPersonalBest = () => {
    const trackTitle = getTrackNameFromType(props.trackName);
    return (
      <CardContent>
        <>
          {props.player.isAuthenticated ? (
            <>
              {personalBest !== -1 ? (
                <Typography>
                  PB on {trackTitle} - {props.numberOfLaps}: {personalBest} sec
                </Typography>
              ) : (
                <Typography>
                  No PB recorded on {trackTitle} - {props.numberOfLaps}.
                </Typography>
              )}
            </>
          ) : (
            <Typography>
              Only logged in players can record their personal best time.
            </Typography>
          )}
        </>
      </CardContent>
    );
  };

  return (
    <Card style={{ height: "100%", backgroundColor: "wheat" }}>
      <CardHeader
        header={props.player.playerName}
        title={
          props.isUser ? (
            <strong>{props.player.playerName}</strong>
          ) : (
            props.player.playerName
          )
        }
        subheader={getVehicleNameFromType(props.player.vehicleType)}
      />
      {props.gameType === "race" &&
        (onDesktop || props.isUser) &&
        renderPersonalBest()}
      {props.player.photoURL ? (
        <CardMedia
          src={props.player.photoURL}
          component="img"
          style={{ height: "50%", width: "auto", margin: "auto" }}
        />
      ) : (
        <CardContent>
          <Typography>No image</Typography>
        </CardContent>
      )}
    </Card>
  );
};

interface IWaitingRoomPlayerList {
  players: IPlayerInfo[];
  playerId: string | undefined;
  trackName: TrackName;
  numberOfLaps: number;
  gameType: GameType;
}

const WaitingRoomPlayerList = (props: IWaitingRoomPlayerList) => {
  const n = props.players.length;
  const containerWidth = Math.min(450, screen.availWidth) - 50;
  let containerHeight = onDesktop ? 600 : 400;
  if (n <= 2) {
    containerHeight = containerHeight / 2;
  }

  if (props.players.length === 0) {
    return <Typography>No players connected</Typography>;
  }

  return (
    <div
      style={{
        position: "relative",
        width: containerWidth,
        height: containerHeight,
        margin: "auto",
        marginTop: 15,
      }}
    >
      {props.players.map((player: IPlayerInfo, i: number) => {
        const viewHeight = n > 2 ? 0.5 : 1.0;
        let viewWidth: number;
        if (n === 3 || n === 1) {
          viewWidth = i < n - 1 ? 0.5 : 1;
        } else {
          viewWidth = 0.5;
        }

        const width = viewWidth * 100;
        const height = viewHeight * 100;
        const left = viewLefts[i % 2] * containerWidth;
        const bottom = viewBottoms[i] * containerHeight;
        return (
          <div
            key={`playerlist-${i}`}
            style={{
              position: "absolute",
              width: `${width}%`,
              height: `${height}%`,
              left,
              bottom,
              border: "1px 1px black solid",
            }}
          >
            <WaitingRoomPlayerItem
              player={player}
              isUser={props.playerId === player.id}
              trackName={props.trackName}
              numberOfLaps={props.numberOfLaps}
              gameType={props.gameType}
            />
          </div>
        );
      })}
    </div>
  );
};

export default WaitingRoomPlayerList;
