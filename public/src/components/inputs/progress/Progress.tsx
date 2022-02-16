import React from "react";
import "./progress.css";

interface IProgress {
  value: number;
  max: number;
  style?: React.CSSProperties;
  extraValue?: number;
}

const Progress = (props: IProgress) => {
  const progressWidth = 200;

  const renderExtraValue = () => {
    if (props.extraValue === undefined) return null;
    const extraValue = props.extraValue ?? 0;

    const width = (extraValue / props.max) * progressWidth;
    // if (props.extraValue > 0) {
    // so it doesnt overflow, should propably put some console.warn
    let extraWidth =
      props.value + extraValue > props.max ? props.max - props.max : extraValue;

    return (
      <div
        className="progress__inner--extra"
        style={{
          position: "relative",
          left: extraValue >= 0 ? 0 : width,
          backgroundColor: extraValue > 0 ? "#aaa" : "#555",
          // width: (extraWidth / props.max) * progressWidth,
          width:
            extraValue >= 0 ? (extraWidth / props.max) * progressWidth : -width,
          outline: extraValue >= 0 ? "none" : "1px white solid",
        }}
      ></div>
    );
  };

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
          width: (props.value / props.max) * progressWidth,
          display: props.extraValue === undefined ? "block" : "inline-block", // dont know why it is like this
        }}
      ></div>
      {renderExtraValue()}
    </div>
  );
};

export default Progress;
