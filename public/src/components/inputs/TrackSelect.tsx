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
import { allTrackNames, ITrackInfo } from "../../classes/Game";
import f1TrackImage from "../../images/tracks/f1-track.PNG";
import farmTrackImage from "../../images/tracks/farm-track.PNG";
import seaSideTrackImage from "../../images/tracks/sea-side-track.PNG";
import { inputBackgroundColor } from "../../providers/theme";
import { GameType, TrackName } from "../../shared-backend/shared-stuff";
import { itemInArray } from "../../utils/utilFunctions";

interface ITrackImagePair {
  image: any;
  trackName: TrackName;
}

const trackImagePair: ITrackImagePair[] = [
  { trackName: "f1-track", image: f1TrackImage },
  { trackName: "farm-track", image: farmTrackImage },
  { trackName: "sea-side-track", image: seaSideTrackImage },
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

  const trackImage = getTrackImage(props.value);
  return (
    <React.Fragment>
      <FormControl fullWidth={props.fullWidth}>
        <InputLabel id="vehicle-select">Track</InputLabel>
        <Select
          style={{
            backgroundColor: inputBackgroundColor,
            minWidth: 200,
          }}
          label="Track"
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
          <Button
            style={{ marginTop: 10 }}
            variant="outlined"
            onClick={() => setShowPreview(!showPreview)}
            startIcon={showPreview ? <ExpandMore /> : <ExpandLess />}
          >
            Map preview
          </Button>

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
