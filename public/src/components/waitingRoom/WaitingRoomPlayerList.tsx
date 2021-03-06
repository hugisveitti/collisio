import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { getTrackNameFromType } from "../../classes/Game";
import { IFollower, IUser } from "../../classes/User";
import { viewBottoms, viewLefts } from "../../game/GameScene";
import {
  GameType,
  IPlayerInfo,
  TrackName,
} from "../../shared-backend/shared-stuff";
import { getDeviceType } from "../../utils/settings";
import { getVehicleNameFromType } from "../../vehicles/VehicleConfigs";
import MyCard from "../card/MyCard";
import FollowButton from "../profile/FollowButton";

interface IWaitingRoomPlayerItem {
  player: IPlayerInfo;
  user: IUser;
  trackName: TrackName;
  numberOfLaps: number;
  gameType: GameType;
}

const onDesktop = getDeviceType() !== "mobile";

const WaitingRoomPlayerItem = (props: IWaitingRoomPlayerItem) => {
  const [personalBest, setPersonalBest] = useState(-1);
  const isUser = props.user?.uid === props.player.id;

  const showPB = onDesktop || isUser;

  const renderPersonalBest = () => {
    const trackTitle = getTrackNameFromType(props.trackName);
    return (
      <CardContent>
        <>
          {/* {props.player.isAuthenticated ? (
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
          )} */}
          {props.player.isLeader && (
            <Typography>
              <i>Leader</i>
            </Typography>
          )}
        </>
      </CardContent>
    );
  };

  const userData: IFollower = {
    displayName: props.user?.displayName,
    uid: props.user?.uid,
    photoURL: props.user?.photoURL,
  };
  const playerFollowingData: IFollower = {
    displayName: props.player.playerName,
    uid: props.player.id,
    photoURL: props.player.photoURL,
  };

  const playerName = props.player.playerName;

  return (
    <MyCard style={{ height: "100%" }}>
      <CardHeader
        titleTypographyProps={{
          fontSize: onDesktop ? "inherit" : 12,
        }}
        header={props.player.playerName}
        title={
          <span style={{ overflowWrap: "anywhere" }}>
            {isUser ? <strong>{playerName}</strong> : playerName}
          </span>
        }
        subheader={getVehicleNameFromType(props.player.vehicleType)}
        action={
          <>
            {props.user && props.player.isAuthenticated && (
              <FollowButton
                userData={userData}
                otherUserData={playerFollowingData}
                onlyIcon
              />
            )}
          </>
        }
      />
      {props.gameType === "race" && showPB && renderPersonalBest()}
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
    </MyCard>
  );
};

interface IWaitingRoomPlayerList {
  players: IPlayerInfo[];
  playerId: string | undefined;
  trackName: TrackName;
  numberOfLaps: number;
  gameType: GameType;
  user: IUser;
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
              user={props.user}
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
