import React from "react";
import { createClassNames } from "../../utils/utilFunctions";
import "./garage-item.css";

interface IGarageItem {
  thumbnail?: React.ReactNode;
  label: string;
  onClick: () => void;
  selected?: boolean;
  style?: React.CSSProperties;
  owned: boolean;
}

const GarageItem = (props: IGarageItem) => {
  return (
    <div
      className={createClassNames(
        "garage__item",
        props.owned ? "garage__item--owned" : "garage__item--not-owned"
      )}
      style={{
        ...props.style,
        outline: props.selected ? "4px solid" : "1px solid",
      }}
      onClick={props.onClick}
    >
      {props.thumbnail}
      {props.label}
    </div>
  );
};

export default GarageItem;
