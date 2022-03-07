import React from "react";
import "./my-date-input.css";

interface IMyDateInput {
  label: string;
  value: string;
  max?: string;
  min?: string;
  onChange: (date: Date) => void;
}

const MyDateInput = (props: IMyDateInput) => {
  return (
    <div className="date-input">
      <span className="date-input__label">{props.label}</span>
      <input
        type="datetime-local"
        // id="tournament-start-time"
        name={props.label}
        value={props.value}
        onChange={(e) => {
          const newStart = new Date(e.target.value);
          props.onChange(newStart);
        }}
        min={props.min}
        max={props.max}
      />
    </div>
  );
};

export default MyDateInput;
