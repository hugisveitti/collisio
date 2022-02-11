import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import {
  CircularProgress,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { getTrackNameFromType } from "../../classes/Game";
import {
  getUserMedals,
  ITrackMedals,
  IUserMedals,
} from "../../firebase/firestoreOwnershipFunctions";
import { getStyledColors } from "../../providers/theme";
import { TrackName } from "../../shared-backend/shared-stuff";
import BackdropButton from "../button/BackdropButton";

interface IMedalsComponentRow {
  trackMedals: ITrackMedals;
  track: TrackName;
}

const MedalsComponentRow = (props: IMedalsComponentRow) => {
  const [open, setOpen] = useState(false);

  const allNumberOfLaps = Object.keys(props.trackMedals);

  let gold = 0;
  let silver = 0;
  let bronze = 0;
  for (let lap of allNumberOfLaps) {
    gold += props.trackMedals[lap].gold ?? 0;
    silver += props.trackMedals[lap].silver ?? 0;
    bronze += props.trackMedals[lap].bronze ?? 0;
  }

  return (
    <React.Fragment>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </TableCell>
        <TableCell>{getTrackNameFromType(props.track)}</TableCell>
        <TableCell>{gold}</TableCell>
        <TableCell>{silver}</TableCell>
        <TableCell>{bronze}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={open} unmountOnExit>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Laps</TableCell>
                  <TableCell>Gold</TableCell>
                  <TableCell>Silver</TableCell>
                  <TableCell>Bronze</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allNumberOfLaps.map((lap) => (
                  <TableRow key={`${props.track}-${lap}`}>
                    <TableCell>{lap}</TableCell>
                    <TableCell>{props.trackMedals[lap].gold ?? 0}</TableCell>
                    <TableCell>{props.trackMedals[lap].silver ?? 0}</TableCell>
                    <TableCell>{props.trackMedals[lap].bronze ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

interface IMedalsComponent {
  userId: string;
}

const MedalsComponent = (props: IMedalsComponent) => {
  const [medalsData, setMedalsData] = useState(null as IUserMedals);

  const { color, backgroundColor } = getStyledColors("white");

  useEffect(() => {
    if (props.userId) {
      getUserMedals(props.userId).then((data) => {
        setMedalsData(data);
      });
    }
  }, [props.userId]);

  if (medalsData === null) {
    return <CircularProgress />;
  }

  if (medalsData === undefined) {
    return <span>No medals</span>;
  }

  const tracks = Object.keys(medalsData);

  return (
    <>
      <Typography>Medals</Typography>
      <Table style={{ color, backgroundColor }}>
        <TableHead>
          <TableRow>
            <TableCell component="th"></TableCell>
            <TableCell component="th">Track</TableCell>
            <TableCell component="th">Gold</TableCell>
            <TableCell component="th">Silver</TableCell>
            <TableCell component="th">Bronze</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tracks.map((track) => {
            return (
              <MedalsComponentRow
                key={track}
                trackMedals={medalsData[track]}
                track={track as TrackName}
              />
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};

export default MedalsComponent;
