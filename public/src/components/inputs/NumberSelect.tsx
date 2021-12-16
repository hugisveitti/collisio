import {
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import React from "react";

interface INumberSelect {
  value: number;
  onChange: (val: number) => void;
  numbers: number[];
  fullWidth?: boolean;
  title: string;
  minWidth?: number;
  style?: React.CSSProperties;
}

const NumberSelect = (props: INumberSelect) => {
  return (
    <FormControl
      fullWidth={props.fullWidth}
      style={{ minWidth: props.minWidth ?? 200, textAlign: "left" }}
    >
      <InputLabel id="vehicle-select">{props.title}</InputLabel>
      <Select
        style={props.style}
        label={props.title}
        name={props.title}
        value={props.value}
        onChange={(e) => {
          props.onChange(+e.target.value);
        }}
      >
        {props.numbers.map((num) => (
          <MenuItem key={num} value={num}>
            {num}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default NumberSelect;
