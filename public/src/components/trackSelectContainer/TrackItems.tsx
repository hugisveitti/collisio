import Grid from "@mui/material/Grid";
import React from "react";
import basic1Image from "../../images/tracks/basic1.jpg";
import basic2Image from "../../images/tracks/basic2.jpg";
import basic3Image from "../../images/tracks/basic3.jpg";
import basic4Image from "../../images/tracks/basic4.jpg";
import basic5Image from "../../images/tracks/basic5.jpg";
import f12TrackImage from "../../images/tracks/f1-track-2.jpg";
import f1TrackImage from "../../images/tracks/f1-track.jpg";
import farmTrackImage from "../../images/tracks/farm-track.jpg";
import ferrariTrackImage from "../../images/tracks/ferrari-top.jpg";
import nurnImage from "../../images/tracks/nurn-track.jpg";
import basic1MinImage from "../../images/tracks/min/min-basic1.jpg";
import basic2MinImage from "../../images/tracks/min/min-basic2.jpg";
import basic3MinImage from "../../images/tracks/min/min-basic3.jpg";
import basic4MinImage from "../../images/tracks/min/min-basic4.jpg";
import basic5MinImage from "../../images/tracks/min/min-basic5.jpg";
import f12TrackMinImage from "../../images/tracks/min/min-f1-track-2.jpg";
import f1TrackMinImage from "../../images/tracks/min/min-f1-track.jpg";
import farmTrackMinImage from "../../images/tracks/min/min-farm-track.jpg";
import ferrariTrackMinImage from "../../images/tracks/min/min-ferrari-top.jpg";
import nurnMinImage from "../../images/tracks/min/min-nurn-track.jpg";
import russiaTrackMinImage from "../../images/tracks/min/min-russia-top.jpg";
import seaSideTrackMinImage from "../../images/tracks/min/min-sea-side-track.jpg";
import spaTrackMinImage from "../../images/tracks/min/min-spa-track.jpg";
import russiaTrackImage from "../../images/tracks/russia-top.jpg";
import seaSideTrackImage from "../../images/tracks/sea-side-track.jpg";
import spaTrackImage from "../../images/tracks/spa-track.jpg";
import simpleTagImage from "../../images/tracks/simple-tag-course.jpg";
import simpleTagMinImage from "../../images/tracks/min/min-simple-tag-course.jpg";
import basicTagImage from "../../images/tracks/basic-tag-course.jpg";
import basicTagMinImage from "../../images/tracks/min/min-basic-tag-course.jpg";

import {
  getTrackInfos,
  possibleTrackCategories,
  TrackCategory,
  TrackName,
} from "../../shared-backend/shared-stuff";
import GarageItem from "../garage/GarageItem";
import MyTabs from "../tabs/MyTabs";

interface ITrackMinImagePair {
  minImage: any;
  largeImage: any;
  trackName: TrackName;
}

const trackImagePair: ITrackMinImagePair[] = [
  {
    trackName: "f1-track",
    minImage: f1TrackMinImage,
    largeImage: f1TrackImage,
  },
  {
    trackName: "f1-track-2",
    minImage: f12TrackMinImage,
    largeImage: f12TrackImage,
  },
  {
    trackName: "farm-track",
    minImage: farmTrackMinImage,
    largeImage: farmTrackImage,
  },
  {
    trackName: "sea-side-track",
    minImage: seaSideTrackMinImage,
    largeImage: seaSideTrackImage,
  },
  {
    trackName: "russia-track",
    minImage: russiaTrackMinImage,
    largeImage: russiaTrackImage,
  },
  {
    trackName: "ferrari-track",
    minImage: ferrariTrackMinImage,
    largeImage: ferrariTrackImage,
  },
  {
    trackName: "spa-track",
    minImage: spaTrackMinImage,
    largeImage: spaTrackImage,
  },
  { trackName: "nurn-track", minImage: nurnMinImage, largeImage: nurnImage },
  {
    trackName: "basic-track1",
    minImage: basic1MinImage,
    largeImage: basic1Image,
  },
  {
    trackName: "basic-track2",
    minImage: basic2MinImage,
    largeImage: basic2Image,
  },
  {
    trackName: "basic-track3",
    minImage: basic3MinImage,
    largeImage: basic3Image,
  },
  {
    trackName: "basic-track4",
    minImage: basic4MinImage,
    largeImage: basic4Image,
  },
  {
    //change
    trackName: "basic-track5",
    minImage: basic5MinImage,
    largeImage: basic5Image,
  },
  {
    trackName: "simple-tag-course",
    minImage: simpleTagMinImage,
    largeImage: simpleTagImage,
  },
  {
    trackName: "basic-tag-course",
    minImage: basicTagMinImage,
    largeImage: basicTagImage,
  },
];

export const getTrackLargeImage = (trackName: TrackName) => {
  for (let tip of trackImagePair) {
    if (tip.trackName === trackName) {
      return tip.largeImage;
    }
  }
  return undefined;
};

const getTrackMinImage = (trackName: TrackName) => {
  for (let tip of trackImagePair) {
    if (tip.trackName === trackName) {
      return tip.minImage;
    }
  }
  return undefined;
};

interface ITrackItems {
  // all active tracks?
  tracks: TrackName[];
  onChange: (newTrack: TrackName) => void;
  selectedTrack: TrackName;
  ownership: { [key: string]: boolean };
  loggedIn: boolean;
}

const TrackItems = (props: ITrackItems) => {
  const trackInfos = getTrackInfos(props.tracks);
  const renderTracks = (category: TrackCategory) => {
    const filteredTracks = trackInfos.filter(
      (track) => track.category === category
    );
    return (
      <Grid container spacing={1} style={{ marginTop: 10 }}>
        {filteredTracks.map((track) => {
          const imgPath = getTrackMinImage(track.type);
          return (
            <Grid key={track.type} item xs={12} md={6} lg={4}>
              <GarageItem
                loggedIn={props.loggedIn}
                owned={props.ownership?.[track.type]}
                selected={track.type === props.selectedTrack}
                label={track.name}
                onClick={() => props.onChange(track.type)}
                thumbnail={
                  <>
                    {imgPath ? (
                      <img
                        src={imgPath}
                        style={{
                          width: "auto",
                          maxHeight: 120,
                          margin: "auto",
                          display: "block",
                        }}
                      />
                    ) : (
                      <span>No thumbnail</span>
                    )}
                  </>
                }
              />
            </Grid>
          );
        })}
      </Grid>
    );
  };
  return (
    <MyTabs
      id="Track-select"
      tabs={possibleTrackCategories.map((item) => {
        return {
          label: item.name,
          renderElement: () => renderTracks(item.category),
        };
      })}
    />
  );
};

export default TrackItems;
