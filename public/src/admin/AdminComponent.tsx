import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Collapse from "@mui/material/Collapse";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import React, { useState } from "react";
import { signOut } from "../firebase/firebaseInit";
import StressTestComponent from "../testMode/StressTestComponent";
import AdminGameData from "./AdminGameData";
import AdminRoomData from "./AdminRoomData";
import AdminTransactionData from "./AdminTransactionData";

interface IAdminComponent {
  userTokenId: string;
  connectionData: { [key: string]: any };
}

const AdminComponent = (props: IAdminComponent) => {
  const [stressCardOpen, setStressCardOpen] = useState(false);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Button
          disableElevation
          variant="contained"
          onClick={() =>
            signOut(() => {
              window.location.href = "/";
            })
          }
        >
          Logout
        </Button>
      </Grid>
      <Grid item xs={12}>
        <ul>
          {Object.keys(props.connectionData).map((key) => {
            return (
              <ul key={key}>
                <span>{key}:</span> <span>{props.connectionData[key]}</span>
              </ul>
            );
          })}
        </ul>
      </Grid>

      <AdminGameData />
      <AdminRoomData />
      <AdminTransactionData />

      <Grid item xs={12}>
        <Card>
          <CardHeader
            header="Stress test"
            title="Stress test"
            subheader="Do a stress test"
            action={
              <IconButton onClick={() => setStressCardOpen(!stressCardOpen)}>
                {stressCardOpen ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            }
          />

          <CardContent>
            <Collapse in={stressCardOpen}>
              <StressTestComponent />
            </Collapse>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default AdminComponent;
