import CloseIcon from "@mui/icons-material/Close";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import React from "react";
import { IScoreInfo } from "../../classes/Game";
import { IEndOfGameData } from "../../game/IGameScene";
import BackdropButton from "../button/BackdropButton";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import BasicDesktopModal from "../modal/BasicDesktopModal";
import { highscorePagePath } from "../Routes";
import RaceTimeTable from "./RaceTimeTable";

/**
 * Display what users place in highscore list
 */

interface IEndOfGameModal {
  open: boolean;
  onClose: () => void;
  data: IEndOfGameData;
  restartGame: () => void;
  scoreInfo: IScoreInfo;
  gameDataInfo: string[];
}

const EndOfGameModal = (props: IEndOfGameModal) => {
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
        {props.gameDataInfo.map((text, i: number) => {
          return (
            <Grid item xs={12} key={`gamedata-info-${i}`}>
              <Typography>{text}</Typography>
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
          <BackdropButton color="white" link={highscorePagePath}>
            See highscores
          </BackdropButton>
        </Grid>
      </Grid>
    </BasicDesktopModal>
  );
};

export default EndOfGameModal;
