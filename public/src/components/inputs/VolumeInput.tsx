import VolumeDown from "@mui/icons-material/VolumeDown";
import VolumeUp from "@mui/icons-material/VolumeUp";
import IconButton from "@mui/material/IconButton";
import React from "react";
import {
  IGameSettings,
  setLocalGameSetting
} from "../../classes/localGameSettings";
import { setMusicVolume } from "../../sounds/gameSounds";
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
    </div>
  );
};

export default VolumeInput;
