import React from "react";
import { createClassNames } from "../../utils/utilFunctions";
import "./garage-item.css";

interface IGarageItem {
  thumbnail?: React.ReactNode;
  label: React.ReactNode;
  onClick: () => void;
  selected?: boolean;
  style?: React.CSSProperties;
  owned: boolean;
  loggedIn: boolean;
}

const GarageItem = (props: IGarageItem) => {
  const outlineColor = props.owned ? (props.selected ? "#ddd" : "#505050") : "";
  return (
    <div
      className={createClassNames(
        "garage__item",
        props.owned ? "garage__item--owned" : "garage__item--not-owned"
      )}
      style={{
        ...props.style,
        outline: props.selected
          ? `5px solid ${outlineColor}`
          : `1px solid ${outlineColor}`,
      }}
      onClick={props.onClick}
    >
      {!props.loggedIn && !props.owned && (
        <div className="garage__item__not-loged-in">You need to login.</div>
      )}
      {props.thumbnail}
      {props.label}
    </div>
  );
};

export default GarageItem;
