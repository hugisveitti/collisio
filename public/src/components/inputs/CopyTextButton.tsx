import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import React, { useState } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

interface ICopyTextButton {
  infoText: string;
  copyText: string;
  onClick?: () => void;
}

const CopyTextButton = (props: ICopyTextButton) => {
  const [copyTooltipOpen, setCopyTooltipOpen] = useState(false);

  return (
    <>
      <span>{props.infoText}</span>{" "}
      <Tooltip
        title="Copied!"
        arrow
        placement="top"
        open={copyTooltipOpen}
        disableFocusListener
        disableHoverListener
        disableTouchListener
        onClose={() => setCopyTooltipOpen(false)}
        onClick={props.onClick}
        style={{ display: "inline" }}
      >
        <IconButton
          style={{ color: "white" }}
          onClick={() => {
            navigator.clipboard.writeText(props.copyText);
            setCopyTooltipOpen(true);
            setTimeout(() => {
              setCopyTooltipOpen(false);
            }, 2000);
          }}
        >
          <ContentCopyIcon />
        </IconButton>
      </Tooltip>
    </>
  );
};

export default CopyTextButton;
