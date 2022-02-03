import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import f1TrackImage from "../../images/tracks/f1-track.PNG";
import f12TrackImage from "../../images/tracks/f1-track-2.PNG";
import russiaTrackImage from "../../images/tracks/russia-top.png";
import ferrariTrackImage from "../../images/tracks/ferrari-top.png";
import spaTrackImage from "../../images/tracks/spa-top.png";

import farmTrackImage from "../../images/tracks/farm-track.PNG";
import seaSideTrackImage from "../../images/tracks/sea-side-track.PNG";
import { getStyledColors, inputBackgroundColor } from "../../providers/theme";
import {
  allTrackNames,
  GameType,
  ITrackInfo,
  TrackName,
} from "../../shared-backend/shared-stuff";
import { itemInArray } from "../../utils/utilFunctions";
import BackdropButton from "../button/BackdropButton";
import "./select.css";

interface ITrackImagePair {
  image: any;
  trackName: TrackName;
}

const trackImagePair: ITrackImagePair[] = [
  { trackName: "f1-track", image: f1TrackImage },
  { trackName: "f1-track-2", image: f12TrackImage },
  { trackName: "farm-track", image: farmTrackImage },
  { trackName: "sea-side-track", image: seaSideTrackImage },
  { trackName: "russia-track", image: russiaTrackImage },
  { trackName: "ferrari-track", image: ferrariTrackImage },
  { trackName: "spa-track", image: spaTrackImage },
];

const getTrackImage = (trackName: TrackName) => {
  for (let tip of trackImagePair) {
    if (tip.trackName === trackName) {
      return tip.image;
    }
  }
  return undefined;
};

interface ITrackSelect {
  gameType: GameType;
  excludedTracks: TrackName[];
  onChange: (trackName: TrackName) => void;
  value: TrackName;
  showMapPreview?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
}

const TrackSelect = (props: ITrackSelect) => {
  const [showPreview, setShowPreview] = useState(false);

  const trackOptions: ITrackInfo[] = [];
  for (let track of allTrackNames) {
    if (
      track.gameType === props.gameType &&
      !itemInArray(track.type, props.excludedTracks)
    ) {
      trackOptions.push(track);
    }
  }

  const { color, backgroundColor } = getStyledColors("white");
  const trackImage = getTrackImage(props.value);
  return (
    <React.Fragment>
      <span className="select__label" style={{ color: backgroundColor }}>
        Track
      </span>
      <FormControl fullWidth={props.fullWidth} disabled={props.disabled}>
        <Select
          className="select"
          style={{
            backgroundColor,
            color,
            minWidth: 200,
          }}
          name="vehicle"
          onChange={(e) => {
            props.onChange(e.target.value as TrackName);
          }}
          value={props.value}
        >
          {trackOptions.map((vehicle) => (
            <MenuItem key={vehicle.type} value={vehicle.type}>
              {vehicle.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {props.showMapPreview && (
        <>
          <br />
          <BackdropButton
            color="white"
            style={{ marginTop: 10 }}
            onClick={() => setShowPreview(!showPreview)}
            startIcon={showPreview ? <ExpandMore /> : <ExpandLess />}
          >
            Map preview
          </BackdropButton>

          <Collapse in={showPreview} style={{ marginTop: 10 }}>
            {trackImage ? (
              <img style={{ maxWidth: "100%" }} src={trackImage} />
            ) : (
              <Typography>No preview available</Typography>
            )}
          </Collapse>
        </>
      )}
    </React.Fragment>
  );
};

export default TrackSelect;
