import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Grid from "@mui/material/Grid";
import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  hasAskedDeviceOrientation,
  requestDeviceOrientation,
} from "../../utils/ControlsClasses";
import BasicModal from "../modal/BasicModal";

interface IDeviceOrientationPermissionComponent {
  onMobile: boolean;
  onIphone: boolean;
}

const DeviceOrientationPermissionComponent = (
  props: IDeviceOrientationPermissionComponent
) => {
  const [modalOpen, setModalOpen] = useState(true);

  // To my knowledge, I only need to ask on Iphones
  if (!props.onMobile || !props.onIphone) return null;

  if (hasAskedDeviceOrientation) return null;

  return (
    <BasicModal
      open={modalOpen}
      onClose={() => {
        setModalOpen(false);
      }}
    >
      <Card>
        <CardHeader subheader="Orientation permission" />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography>
                Since you steer with your phone, we need to access the
                orientation information on your phone. Press the button below to
                allow this information.
              </Typography>
            </Grid>
            <Grid item xs={12} style={{ textAlign: "center" }}>
              <Button
                variant="contained"
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
                }}
              >
                Click me!
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </BasicModal>
  );
};

export default DeviceOrientationPermissionComponent;
