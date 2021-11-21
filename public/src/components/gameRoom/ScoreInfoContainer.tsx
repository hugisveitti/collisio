/** Currently only for race time table
 * But will include other game modes
 */
import React from "react";
import { IRaceTimeInfo, IScoreInfo } from "../../classes/Game";
import RaceTimeTable from "./RaceTimeTable";
import TagScoreTable from "./TagScoreTable";

interface IScoreInfoContainer {
  scoreInfo: IScoreInfo;
}

const ScoreInfoContainer = (props: IScoreInfoContainer) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: 300,
        opacity: 0.5,
      }}
    >
      {props.scoreInfo.timeInfos && (
        <RaceTimeTable
          raceTimeInfo={props.scoreInfo.timeInfos}
          isEndOfGame={false}
        />
      )}
      {props.scoreInfo.tagInfos && (
        <TagScoreTable
          tagInfos={props.scoreInfo.tagInfos}
          isEndOfGame={false}
        />
      )}
    </div>
  );
};

export default ScoreInfoContainer;
