/** Currently only for race time table
 * But will include other game modes
 */
import React from "react";
import { IRaceTimeInfo } from "../../classes/Game";
import RaceTimeTable from "./RaceTimeTable";

interface IScoreInfoContainer {
  raceTimeInfo: IRaceTimeInfo[];
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
      <RaceTimeTable raceTimeInfo={props.raceTimeInfo} dense />
    </div>
  );
};

export default ScoreInfoContainer;
