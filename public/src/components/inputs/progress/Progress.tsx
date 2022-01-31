import React from "react";
import "./progress.css";

interface IProgress {
  value: number;
  max: number;
}

const Progress = (props: IProgress) => {
  return <progress className="progress" value={props.value} max={props.max} />;
};

export default Progress;
