import VolumeDown from "@mui/icons-material/VolumeDown";
import VolumeUp from "@mui/icons-material/VolumeUp";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeDownIcon from "@mui/icons-material/VolumeDown";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import React from "react";
import {
  IGameSettings,
  setLocalGameSetting,
} from "../../classes/localGameSettings";
import { setMusicVolume, setPlaySounds } from "../../sounds/gameSounds";
import { IStore } from "../store";
import MySlider from "./slider/MySlider";

interface IVolumeInput {
  store: IStore;
  onChange?: () => void;
}

const VolumeInput = (props: IVolumeInput) => {
  return (
    <div style={{ marginTop: 15 }} className="background">
      <MySlider
        startIcon={
          <IconButton
            style={{ color: "white" }}
            onClick={() => {
              const newGameSettings: IGameSettings = {
                ...props.store.gameSettings,
                musicVolume: 0 as number,
              };
              props.store.setGameSettings(newGameSettings);
              setLocalGameSetting("musicVolume", 0);
              setMusicVolume(0);
            }}
          >
            <VolumeDown />
          </IconButton>
        }
        endIcon={<VolumeUp />}
        label="Music volume"
        onChangeCommitted={(newVal) => {
          const newGameSettings: IGameSettings = {
            ...props.store.gameSettings,
            musicVolume: newVal as number,
          };
          props.store.setGameSettings(newGameSettings);
          setLocalGameSetting("musicVolume", newVal as number);
        }}
        onChange={(newVal) => {
          setMusicVolume(newVal as number);
          const newGameSettings: IGameSettings = {
            ...props.store.gameSettings,
            musicVolume: newVal as number,
          };
          props.store.setGameSettings(newGameSettings);
        }}
        value={props.store.gameSettings.musicVolume}
        step={0.01}
        max={1}
        min={0}
        color="white"
      />
      <br />
      <Typography>Sound effects</Typography>
      <IconButton
        style={{ color: "white" }}
        onClick={() => {
          const newGameSettings: IGameSettings = {
            ...props.store.gameSettings,
            useSound: !props.store.gameSettings.useSound,
          };

          props.store.setGameSettings(newGameSettings);
          setLocalGameSetting("useSound", !props.store.gameSettings.useSound);
        }}
      >
        {props.store.gameSettings.useSound ? (
          <VolumeUpIcon />
        ) : (
          <VolumeOffIcon />
        )}
      </IconButton>
    </div>
  );
};

export default VolumeInput;
