import React from "react";

interface IBlackLoadingPage {
  ratio: number;
}

const BlackLoadingPage = (props: IBlackLoadingPage) => {
  const loadingBarWidth = props.ratio > 0 ? props.ratio * 200 : 0;

  // if (props.ratio === 1) return null;

  return (
    <div
      className="black-loading-page"
      style={{
        zIndex: props.ratio < 1 ? 999 : -1000,
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        backgroundColor: props.ratio < 1 ? "#000" : "#fff",
        transition: "2s",
      }}
    >
      <div
        style={{
          visibility: props.ratio < 1 ? "visible" : "hidden",
          width: 200,
          margin: "auto",
          border: "2px solid #fff",
          height: 20,
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
        }}
      >
        <div
          style={{
            border: "none",
            width: loadingBarWidth,
            height: 20,
            backgroundColor: "#fff",
          }}
        ></div>
      </div>
    </div>
  );
};

export default BlackLoadingPage;
