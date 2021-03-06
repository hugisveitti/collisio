import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";

interface IMySlider {
  label: React.ReactNode;
  onChangeCommitted: (newVal: number | number[]) => void;
  onChange: (newVal: number | number[]) => void;
  max: number;
  min: number;
  value: number;
  step: number;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  color?: string;
}

const MySlider = (props: IMySlider) => {
  return (
    <>
      <Typography>{props.label}</Typography>
      <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
        {props.startIcon}
        <Slider
          style={{ color: props.color ?? "white" }}
          min={props.min}
          max={props.max}
          valueLabelDisplay="auto"
          step={props.step}
          // defaultValue={defaultValue}
          value={props.value}
          onChange={(e, value) => {
            props.onChange(value);
          }}
          onChangeCommitted={(e, value) => {
            props.onChangeCommitted(value);
          }}
        />
        {props.endIcon}
      </Stack>
    </>
  );
};

export default MySlider;
