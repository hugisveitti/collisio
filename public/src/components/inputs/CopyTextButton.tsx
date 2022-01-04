import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import React, { useState } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

interface ICopyTextButton {
  infoText: string;
  copyText: string;
}

const CopyTextButton = (props: ICopyTextButton) => {
  const [copyTooltipOpen, setCopyTooltipOpen] = useState(false);

  return (
    <>
      <Typography component="span">{props.infoText}</Typography>{" "}
      <Tooltip
        title="Link copied!"
        arrow
        placement="top"
        open={copyTooltipOpen}
        disableFocusListener
        disableHoverListener
        disableTouchListener
        onClose={() => setCopyTooltipOpen(false)}
      >
        <IconButton
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
