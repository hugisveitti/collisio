import { Modal } from "@mui/material";
import React from "react";

interface IBasicModal {
  open: boolean;
  onClose: () => void;
  children: JSX.Element;
}

const BasicModal = (props: IBasicModal) => {
  return (
    <Modal open={props.open} onClose={props.onClose} style={{ border: 0 }}>
      <div
        style={{
          transform: "translate(-4%, -25%)",
          position: "absolute",
          top: "25%",
          left: "8%",
          backgroundColor: "#eeebdf",
          border: "2px solid #000",
          padding: 10,
          outline: 0,
        }}
      >
        {props.children}
      </div>
    </Modal>
  );
};

export default BasicModal;
