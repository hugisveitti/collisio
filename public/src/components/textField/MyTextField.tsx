import { TextField } from "@mui/material";
import React from "react";
import { getStyledColors } from "../../providers/theme";
import "./my-text-field.css";

interface IMyTextField {
  label: string;
  onChange: (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => void;
  onBlur?: (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => void;
  value: string | number;
  fullWidth?: boolean;
  disabled?: boolean;
  color?: "white" | "black";
  id?: string;
  type?: string;
}

const MyTextField = (props: IMyTextField) => {
  const { color, backgroundColor } = getStyledColors(props.color ?? "white");

  return (
    <React.Fragment>
      <span
        className="text-field__label"
        style={{ color: backgroundColor, background: color }}
      >
        {props.label}
      </span>
      <TextField
        className="text-field"
        type={props.type}
        id={props.id}
        style={{
          color,
          backgroundColor,
        }}
        autoComplete="false"
        value={props.value ?? ""}
        onChange={props.onChange}
        disabled={props.disabled}
        fullWidth={props.fullWidth}
        placeholder={props.label}
        onBlur={props.onBlur}
      />
    </React.Fragment>
  );
};

export default MyTextField;
