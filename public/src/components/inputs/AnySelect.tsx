import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import React from "react";
import { BotDifficulty } from "../../classes/localGameSettings";

interface IOption<V> {
  value: V;
  name: string;
}

type AnySelectType = BotDifficulty | string;

interface IAnySelect<AnySelectType> {
  selectedValue: AnySelectType;
  onChange: (val: AnySelectType) => void;
  options: IOption<AnySelectType>[];
  fullWidth?: boolean;
  title: string;
  minWidth?: number;
  style?: React.CSSProperties;
  disabled?: boolean;
}

const AnySelect: <AnySelectType>(
  p: IAnySelect<AnySelectType>
) => React.ReactElement<IAnySelect<AnySelectType>> = (props) => {
  return (
    <FormControl
      disabled={props.disabled}
      fullWidth={props.fullWidth}
      style={{ minWidth: props.minWidth ?? 200, textAlign: "left" }}
    >
      <InputLabel id="vehicle-select">{props.title}</InputLabel>
      <Select<AnySelectType>
        style={props.style}
        label={props.title}
        name={props.title}
        value={props.selectedValue as any}
        onChange={(e) => {
          props.onChange(e.target.value as any);
        }}
      >
        {props.options.map((option) => (
          <MenuItem key={option.name} value={option.value as any}>
            {option.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default AnySelect;
