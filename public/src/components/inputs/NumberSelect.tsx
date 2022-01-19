import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import React from "react";
import { getStyledColors } from "../../providers/theme";
import "./select.css";

interface INumberSelect {
  value: number;
  onChange: (val: number) => void;
  numbers: number[];
  fullWidth?: boolean;
  title: string;
  minWidth?: number;
  style?: React.CSSProperties;
  disabled?: boolean;
  color?: "white" | "black";
}

const NumberSelect = (props: INumberSelect) => {
  const { color, backgroundColor } = getStyledColors(props.color ?? "white");
  return (
    <React.Fragment>
      <span className="select__label" style={{ color: backgroundColor }}>
        {props.title}
      </span>
      <FormControl
        disabled={props.disabled}
        fullWidth={props.fullWidth}
        style={{ minWidth: props.minWidth ?? 200, textAlign: "left" }}
      >
        <Select
          className="select"
          style={{ ...props.style, color, backgroundColor }}
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
    </React.Fragment>
  );
};

export default NumberSelect;
