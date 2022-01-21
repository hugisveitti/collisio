import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import React from "react";
import "./my-checkbox.css";

interface IMyCheckbox {
  checked: boolean;
  onChange: () => void;
  label: string;
}

const MyCheckbox = (props: IMyCheckbox) => {
  return (
    <FormControlLabel
      label={props.label}
      control={<Checkbox checked={props.checked} onChange={props.onChange} />}
    />
  );
};

export default MyCheckbox;
