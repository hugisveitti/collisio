import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import React, { useState } from "react";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { getTrackNameFromType, IEndOfRaceInfoPlayer } from "../../classes/Game";
import { getVehicleNameFromType } from "../../vehicles/VehicleConfigs";
import { getUserPagePath } from "../Routes";
import { getDateFromNumber } from "../../utils/utilFunctions";
import BackdropButton from "../button/BackdropButton";
import CopyTextButton from "../inputs/CopyTextButton";
import { IStore } from "../store";
import { setLocalGameSetting } from "../../classes/localGameSettings";

interface IProps {
  playerData: IEndOfRaceInfoPlayer;
  includeTrackAndNumLaps?: boolean;
}

export default (props: IProps) => {
  const [open, setOpen] = useState(false);
  // let open = false;

  const { playerData } = props;
  const raceDate =
    typeof playerData.date === "number"
      ? getDateFromNumber(playerData.date)
      : playerData.date;
  return (
    <React.Fragment>
      <TableRow onClick={() => {}} sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => {
              setOpen(!open);
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <a
            style={{ color: "inherit" }}
            href={getUserPagePath(playerData.playerId)}
          >
            {playerData.playerName}
          </a>
        </TableCell>
        <TableCell>{playerData.totalTime}</TableCell>
        <TableCell>{playerData.bestLapTime}</TableCell>
        {props.includeTrackAndNumLaps && (
          <>
            <TableCell>{getTrackNameFromType(playerData.trackName)}</TableCell>
            <TableCell>{playerData.numberOfLaps}</TableCell>
          </>
        )}
        <TableCell>
          {getVehicleNameFromType(playerData.vehicleType) ?? "-"}
        </TableCell>
        <TableCell>
          {playerData.recordingFilename ? (
            <CopyTextButton
              infoText="Copy ghost filename"
              copyText={playerData.recordingFilename}
              onClick={() => {
                setLocalGameSetting("useGhost", true);
                setLocalGameSetting(
                  "ghostFilename",
                  playerData.recordingFilename
                );
              }}
            />
          ) : (
            "No ghost"
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell
          style={{ paddingBottom: 0, paddingTop: 0 }}
          colSpan={5 + (props.includeTrackAndNumLaps ? 2 : 0)}
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <div
              style={{
                margin: 10,
                padding: 5,
              }}
            >
              Lap times:
              {playerData.lapTimes.map((lap, i) => {
                return (
                  <span
                    key={`${playerData.gameId}-${playerData.playerName}-lap${i}`}
                    style={{
                      marginLeft: 15,
                    }}
                  >
                    {lap}
                  </span>
                );
              })}
              <div>Date of race: {raceDate}</div>
              <div>
                Type of vehicle:{" "}
                {getVehicleNameFromType(playerData.vehicleType) ?? "-"}
              </div>
            </div>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};
