import CloseIcon from "@mui/icons-material/Close";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { IEndOfRaceInfoPlayer, IScoreInfo } from "../../classes/Game";
import { IUser } from "../../classes/User";
import {
  getBestScoresOnTrackAndLap,
  getPersonalBestInfo,
  getScoreInfo,
  IBestTime,
} from "../../firebase/firestoreGameFunctions";
import { IEndOfGameData } from "../../game/IGameScene";
import {
  getMedalAndTokens,
  getNextMedal,
  IMedalAndToken,
} from "../../shared-backend/medalFuncions";
import { itemInArray } from "../../utils/utilFunctions";
import BackdropButton from "../button/BackdropButton";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import BasicDesktopModal from "../modal/BasicDesktopModal";
import { highscorePagePath } from "../Routes";
import { IStore } from "../store";
import RaceTimeTable from "./RaceTimeTable";

interface IBestTimesInfo {
  [playerId: string]: IBestTime;
}

export interface IGameDataInfo {
  bestTimesInfo: IBestTimesInfo;
  tournamentInfo?: string;
}

// Think about special vehicle ??
interface IPlayerRaceInfo extends IBestTime {
  medal?: IMedalAndToken;
  playerName: string;
  totalTime: number;
  isAuthenticated: boolean;
}

interface IMoreBestTimeInfo {
  [playerId: string]: IPlayerRaceInfo;
}

interface IMoreGameDataInfo {
  bestTimesInfo: IMoreBestTimeInfo;
  tournamentInfo?: string;
}

/**
 * Display what users place in highscore list
 */

interface IEndOfGameModal {
  open: boolean;
  onClose: () => void;
  /** Data from game */
  data: IEndOfGameData;
  restartGame: () => void;
  scoreInfo: IScoreInfo;
  /** General info about race, such as secs from all time best */
  gameDataInfo: IGameDataInfo;
  quitGame: (newPath: string) => void;
  store: IStore;
}

const EndOfGameModal = (props: IEndOfGameModal) => {
  let anyoneAuth = false;
  for (let i = 0; i < props.store.players.length; i++) {
    if (props.store.players[i].isAuthenticated) {
      anyoneAuth = true;
    }
  }

  /** All time best data */
  const [trackData, setTrackData] = useState([] as IEndOfRaceInfoPlayer[]);

  useEffect(() => {
    if (props.data.endOfRaceInfo) {
      const { trackName, numberOfLaps } = props.data.endOfRaceInfo.roomSettings;
      getBestScoresOnTrackAndLap(trackName, numberOfLaps, 0, 5).then((data) => {
        setTrackData(data);
      });
    }
  }, [props.data?.endOfRaceInfo]);

  let info: IMoreGameDataInfo = {
    tournamentInfo: props.gameDataInfo.tournamentInfo,
    bestTimesInfo: {},
  };

  if (props.data.endOfRaceInfo) {
    for (let player of props.data.endOfRaceInfo.playersInfo) {
      let obj: IPlayerRaceInfo = {
        playerId: player.id,
        playerName: player.name,
        totalTime: player.totalTime,
        isAuthenticated: player.isAuthenticated,
      };
      if (
        player.isAuthenticated &&
        itemInArray(player.id, Object.keys(props.gameDataInfo.bestTimesInfo))
      ) {
        obj.bestTime = props.gameDataInfo.bestTimesInfo[player.id].bestTime;
      }
      const { trackName, numberOfLaps } = props.data.endOfRaceInfo.roomSettings;

      obj.medal = getMedalAndTokens(trackName, numberOfLaps, player.totalTime);
      info.bestTimesInfo[player.id] = obj;
    }
  }

  return (
    <BasicDesktopModal open={props.open} onClose={props.onClose}>
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <h3>Race over</h3>
        </Grid>

        <Grid item xs={6} style={{ textAlign: "right" }}>
          <IconButton onClick={props.onClose} style={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </Grid>
        {!anyoneAuth && (
          <Grid item xs={12}>
            <Typography>
              Players need to be logged in on the phone for the score to be
              saved on the leaderboard.
            </Typography>
          </Grid>
        )}
        {info.tournamentInfo && (
          <Grid item xs={12}>
            {info.tournamentInfo}
          </Grid>
        )}
        <Grid item xs={12}>
          <h3>Race info</h3>
        </Grid>
        {Object.keys(info.bestTimesInfo).map((playerId, i: number) => {
          const data = info.bestTimesInfo[playerId];

          return (
            <Grid item xs={12} key={`gamedata-info-${i}`}>
              <h4>{data.playerName}</h4>
              <div style={{ marginLeft: 15 }}>
                <Typography>
                  Won{" "}
                  {data.medal?.medal === "none"
                    ? "no"
                    : `the ${data.medal?.medal}`}{" "}
                  medal, {data.medal?.coins.toFixed(0)} coins and{" "}
                  {data.medal?.XP.toFixed(2)} XP.{" "}
                  {data.medal?.secToNext &&
                    `${
                      data.medal.secToNext
                    } seconds from getting ${getNextMedal(data.medal.medal)}`}
                </Typography>
                {trackData.length > 0 ? (
                  <>
                    {getScoreInfo(trackData, {
                      playerName: data.playerName,
                      totalTime: data.totalTime,
                    }).map((str, idx: number) => (
                      <Typography
                        key={`${data.playerName}-${i}-raceinfo`}
                        style={{ marginRight: 10 }}
                      >
                        {str}
                      </Typography>
                    ))}
                  </>
                ) : (
                  <Typography>Set and all time best record!</Typography>
                )}
                {data.isAuthenticated ? (
                  <React.Fragment>
                    {getPersonalBestInfo(
                      { playerId: data.playerId, bestTime: data.bestTime },
                      { playerName: data.playerName, totalTime: data.totalTime }
                    ).map((str, idx: number) => (
                      <Typography
                        key={`${data.playerName}-${i}-personal-info`}
                        style={{ marginRight: 10 }}
                      >
                        {str}
                      </Typography>
                    ))}
                  </React.Fragment>
                ) : (
                  <Typography>Is not logged in.</Typography>
                )}
              </div>
            </Grid>
          );
        })}
        {props.scoreInfo && (
          <Grid item xs={12}>
            <RaceTimeTable
              isEndOfGame
              raceTimeInfo={props.scoreInfo.timeInfos}
            />
          </Grid>
        )}
        <Grid item xs={6} xl={2}>
          <BackdropButton onClick={props.restartGame}>Restart</BackdropButton>
        </Grid>
        <Grid item xs={6} xl={2}>
          <ToFrontPageButton />
        </Grid>
        <Grid item xs={6} xl={2}>
          <BackdropButton
            color="white"
            onClick={() => props.quitGame(highscorePagePath)}
          >
            See highscores
          </BackdropButton>
        </Grid>
      </Grid>
    </BasicDesktopModal>
  );
};

export default EndOfGameModal;
