import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import React from "react";

interface IOption {
  value: any;
  name: string;
}

interface IAnySelect {
  selectedValue: IOption;
  onChange: (val: any) => void;
  options: IOption[];
  fullWidth?: boolean;
  title: string;
  minWidth?: number;
  style?: React.CSSProperties;
  disabled?: boolean;
}

const AnySelect = (props: IAnySelect) => {
  return (
    <FormControl
      disabled={props.disabled}
      fullWidth={props.fullWidth}
      style={{ minWidth: props.minWidth ?? 200, textAlign: "left" }}
    >
      <InputLabel id="vehicle-select">{props.title}</InputLabel>
      <Select
        style={props.style}
        label={props.title}
        name={props.title}
        value={props.selectedValue.value}
        onChange={(e) => {
          props.onChange(e.target.value);
        }}
      >
        {props.options.map((option) => (
          <MenuItem key={option.name} value={option.value}>
            {option.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default AnySelect;
