import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  getHasAskedDeviceOrientation,
  requestDeviceOrientation,
} from "../../utils/ControlsClasses";
import BackdropButton from "../button/BackdropButton";
import MyCard from "../card/MyCard";
import BasicModal from "../modal/BasicModal";

interface IDeviceOrientationPermissionComponent {
  onMobile: boolean;
  onIphone: boolean;
  showModal?: boolean;
  onClose?: () => void;
}

const DeviceOrientationPermissionComponent = (
  props: IDeviceOrientationPermissionComponent
) => {
  const [modalOpen, setModalOpen] = useState(true);

  // To my knowledge, I only need to ask on Iphones
  if (!props.onMobile || (getHasAskedDeviceOrientation() && !props.showModal))
    return null;

  return (
    <BasicModal
      open={modalOpen}
      onClose={() => {
        setModalOpen(false);
      }}
    >
      <MyCard>
        <CardHeader subheader="Orientation permission" />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography>
                Click the button to allow the use of your device orientation.
                (For the steering). If the controls still don't work, try
                switching mobile browsers, we recommend Chrome.
              </Typography>
            </Grid>
            <Grid item xs={12} style={{ textAlign: "center" }}>
              <BackdropButton
                onClick={() => {
                  requestDeviceOrientation(
                    (permissionGranted: boolean, message: string) => {
                      if (permissionGranted) {
                        setModalOpen(false);
                        toast.success(message);
                      } else {
                        toast.error(message);
                      }
                    }
                  );
                  if (props.onClose) {
                    props.onClose();
                  }
                }}
              >
                Click me!
              </BackdropButton>
            </Grid>
          </Grid>
        </CardContent>
      </MyCard>
    </BasicModal>
  );
};

export default DeviceOrientationPermissionComponent;
