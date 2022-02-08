import React from "react";
import "./progress.css";

interface IProgress {
  value: number;
  max: number;
  style?: React.CSSProperties;
}

const Progress = (props: IProgress) => {
  return (
    <div
      className="progress"
      style={{
        ...props.style,
      }}
    >
      <div
        className="progress__inner"
        style={{
          width: (props.value / props.max) * 200,
        }}
      ></div>
    </div>
    // <progress
    //   className="progress"
    //   style={props.style}
    //   value={props.value}
    //   max={props.max}
    // />
  );
};

export default Progress;
