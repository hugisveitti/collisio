import { Grid } from "@mui/material";
import React, { useEffect, useState } from "react";
import {
  defaultTagTrack,
  defaultRaceTrack,
  defaultStoryTrack,
  numberOfLapsPossibilities,
  getTrackNameFromType,
  nonActiveTrackNames,
} from "../../classes/Game";
import {
  IRoomSettings,
  setLocalGameSetting,
  setLocalRoomSetting,
} from "../../classes/localGameSettings";
import { getStyledColors } from "../../providers/theme";
import { GameType } from "../../shared-backend/shared-stuff";
import { getDeviceType, inTestMode } from "../../utils/settings";
import NumberSelect from "../inputs/NumberSelect";
import MyRadio from "../radio/MyRadio";
import { IStore } from "../store";
import MyTextField from "../textField/MyTextField";
import TrackSelect from "../trackSelectContainer/TrackSelect";

interface IRoomSettingsComponent {
  roomSettings: IRoomSettings;
  onChange: (roomSettings: IRoomSettings) => void;
  inTestMode?: boolean;
  store: IStore;
  multiplayer?: boolean;
  disableInputs?: boolean;
}

const RoomSettingsComponent = (props: IRoomSettingsComponent) => {
  const [roomSettings, setRoomSettings] = useState(props.roomSettings);

  const onMobile = getDeviceType() === "mobile";

  const { color, backgroundColor } = getStyledColors("black");

  const disableInputs = !!roomSettings.tournamentId;

  useEffect(() => {
    if (props.multiplayer) {
      const newRoomSettings: IRoomSettings = {
        ...roomSettings,
      };
      if (roomSettings.gameType !== "race") {
        newRoomSettings.gameType = "race";
      }
      setRoomSettings(newRoomSettings);
      props.onChange(newRoomSettings);
    }
  }, []);

  const updateRoomSettings = (
    key: keyof IRoomSettings,
    value: any,
    _roomSettings?: IRoomSettings,
    notEmit?: boolean
  ) => {
    const newRoomSettings = _roomSettings
      ? {
          ..._roomSettings,
        }
      : {
          ...props.roomSettings,
        };
    // @ts-ignore
    newRoomSettings[key] = value;

    if (key === "gameType") {
      if (value === "tag") {
        newRoomSettings.trackName = defaultTagTrack;
      } else if (value === "race") {
        newRoomSettings.trackName = defaultRaceTrack;
      } else if (value === "story") {
        newRoomSettings.trackName = defaultStoryTrack;
      }
    }

    setLocalRoomSetting(key, value);

    setRoomSettings(newRoomSettings);
    if (!notEmit) {
      props.onChange(newRoomSettings);
    }
  };

  useEffect(() => {
    setRoomSettings(props.roomSettings);
  }, [props.roomSettings]);

  const renderGameTypeInputs = () => {
    if (props.roomSettings.gameType === "race") {
      return (
        <React.Fragment>
          <Grid item xs={12} lg={4} xl={4}>
            <NumberSelect
              disabled={disableInputs}
              title="No. of laps"
              value={roomSettings.numberOfLaps}
              numbers={numberOfLapsPossibilities}
              onChange={(val) => {
                updateRoomSettings("numberOfLaps", val);
              }}
              style={{
                backgroundColor,
              }}
            />
          </Grid>
        </React.Fragment>
      );
    }
    if (props.roomSettings.gameType === "tag") {
      return (
        <React.Fragment>
          <Grid item xs={12} lg={4} xl={4}>
            <MyTextField
              disabled={disableInputs}
              type="number"
              label="Tag game length in minutes"
              value={
                roomSettings.tagGameLength ? roomSettings.tagGameLength : ""
              }
              onChange={(ev) => {
                updateRoomSettings("tagGameLength", +ev.target.value);
              }}
            />
          </Grid>
        </React.Fragment>
      );
    }

    return null;
  };

  return (
    <React.Fragment>
      {!props.multiplayer && (
        <Grid item xs={12} lg={4}>
          <MyRadio<GameType>
            label="Type of game"
            checked={roomSettings.gameType}
            onChange={(newType) => updateRoomSettings("gameType", newType)}
            options={[
              { label: "Race", value: "race" },
              { label: "Tag", value: "tag" },
            ]}
            disabled={disableInputs}
          />
        </Grid>
      )}
      {renderGameTypeInputs()}
      <Grid item xs={12} lg={4}>
        <p>
          Selected track is{" "}
          <strong
            style={{
              backgroundColor: "white",
              color: "black",
              padding: 3,
              fontSize: 16,
            }}
          >
            {" "}
            {getTrackNameFromType(roomSettings.trackName)}
          </strong>
        </p>
      </Grid>
      <Grid item xs={12}>
        <TrackSelect
          disabled={disableInputs}
          gameType={roomSettings.gameType}
          excludedTracks={
            props.inTestMode || inTestMode ? [] : nonActiveTrackNames
          }
          value={roomSettings.trackName}
          onChange={(newTrackName) => {
            updateRoomSettings("trackName", newTrackName);
          }}
          store={props.store}
          buttonToOpen
          simpleSelect={props.inTestMode}
        />
      </Grid>
    </React.Fragment>
  );
};

export default RoomSettingsComponent;
