import {
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import React from "react";
import "./radio.css";

interface IMyRadio<T extends string | boolean> {
  label: string;
  options: { label: string; value: T }[];
  checked: T;
  onChange: (newVal: T) => void;
  center?: boolean;
  disabled?: boolean;
}

const MyRadio: <T extends string | boolean>(
  p: IMyRadio<T>
) => React.ReactElement<IMyRadio<T>> = (props) => {
  return (
    <>
      <span
        className="radio__label"
        style={{ margin: props.center ? "auto" : "" }}
      >
        {props.label}
      </span>
      <FormControl component="fieldset" disabled={props.disabled}>
        <RadioGroup
          className="radio"
          row
          aria-label="type of tournament"
          name="row-radio-buttons-group"
        >
          {props.options.map((option) => {
            return (
              <FormControlLabel
                key={option.label}
                value={option.value}
                control={
                  <Radio
                    onChange={() => props.onChange(option.value)}
                    checked={props.checked === option.value}
                  />
                }
                label={option.label}
              />
            );
          })}
        </RadioGroup>
      </FormControl>
    </>
  );
};

export default MyRadio;
