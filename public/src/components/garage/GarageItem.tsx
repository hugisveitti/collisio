import React from "react";
import "./garage-item.css";

interface IGarageItem {
  thumbnail?: React.ReactNode;
  label: string;
  onClick: () => void;
  selected?: boolean;
}

const GarageItem = (props: IGarageItem) => {
  return (
    <div
      className="garage__item"
      style={{
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
