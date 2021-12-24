import { IconButton } from "@mui/material";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import React, { useState } from "react";
import { toast } from "react-toastify";

const FullscreenButton = () => {
  /**
   * TODO: There are some differences between gecko and webkit which I should probably look into
   */
  const [isFullscreen, setIsFullscreen] = useState(
    document.fullscreenElement !== null
  );

  return (
    <IconButton
      onClick={() => {
        screen?.orientation?.lock?.("landscape");
        if (!document.body.requestFullscreen) {
          toast.error("Connot enter fullscreen");
        }

        if (document.fullscreenElement === null) {
          document.body
            .requestFullscreen()
            .then(() => {
              setIsFullscreen(true);
            })
            .catch((err) => {
              console.warn("Error entering fullscreen:", err);
            });
        } else {
          setIsFullscreen(false);
          document.exitFullscreen().catch((err) => {
            console.warn("Error exiting fullscreen:", err);
          });
        }
      }}
    >
      {!isFullscreen ? <FullscreenIcon /> : <FullscreenExitIcon />}
    </IconButton>
  );
};

export default FullscreenButton;
