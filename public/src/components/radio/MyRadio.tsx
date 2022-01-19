import {
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import React from "react";
import "./radio.css";

interface IMyRadio {
  label: string;
  options: string[];
  checked: string;
  onChange: (newVal: string) => void;
  center?: boolean;
}

const MyRadio = (props: IMyRadio) => {
  return (
    <>
      <span
        className="radio__label"
        style={{ margin: props.center ? "auto" : "" }}
      >
        {props.label}
      </span>
      <FormControl component="fieldset">
        <RadioGroup
          className="radio"
          row
          aria-label="type of tournament"
          name="row-radio-buttons-group"
        >
          {props.options.map((option) => {
            return (
              <FormControlLabel
                key={option}
                value="local"
                control={
                  <Radio
                    onChange={() => props.onChange(option)}
                    checked={props.checked === option}
                  />
                }
                label="Local"
              />
            );
          })}
        </RadioGroup>
      </FormControl>
    </>
  );
};

export default MyRadio;
