import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Collapse,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import AppContainer from "../containers/AppContainer";
import { activeVehicleTypes } from "../vehicles/VehicleConfigs";
import { frontPagePath } from "./Routes";

interface IPremiumOptionListItem {
  title: string;
  extraText: string[];
}

const PremiumOptionListItem = (props: IPremiumOptionListItem) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ListItemButton onClick={() => setOpen(!open)}>
        <ListItemText primary={props.title} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={open}>
        <List>
          {props.extraText.map((t) => (
            <ListItem key={t} style={{ paddingLeft: 25 }}>
              <ListItemText key={t} primary={t} />
            </ListItem>
          ))}
        </List>
      </Collapse>
    </>
  );
};

interface IBuyPremiumComponent {}

const BuyPremiumComponent = (props: IBuyPremiumComponent) => {
  const history = useHistory();
  return (
    <AppContainer>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Choose plan"
              header="Choose plan"
              subheader="You can either buy a premium account or continue using a free account."
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Card style={{ backgroundColor: "#e9f472" }}>
                    <CardHeader
                      title="Premium"
                      header="Premium"
                      subheader="$10 one time payment"
                    />
                    <CardContent>
                      <List>
                        <PremiumOptionListItem
                          title="Access to all maps"
                          extraText={["Farm", "Seaside"]}
                        />
                        <PremiumOptionListItem
                          title="Access to all vehicles"
                          extraText={activeVehicleTypes.map((v) => v.name)}
                        />
                        <PremiumOptionListItem
                          title="Access to game modes"
                          extraText={["Race", "Traffic school"]}
                        />
                      </List>
                    </CardContent>
                    <CardActions>
                      <Button
                        style={{ backgroundColor: "#0bb129" }}
                        variant="contained"
                        onClick={() => toast("Premium not available yet")}
                      >
                        Buy Premium
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card style={{ backgroundColor: "gainsboro" }}>
                    <CardHeader title="Basic" header="Basic" subheader="Free" />
                    <CardContent>
                      <List>
                        <PremiumOptionListItem
                          title="Access to one map"
                          extraText={["Farm"]}
                        />
                        <PremiumOptionListItem
                          title="Access to one vehicle"
                          extraText={["Normal"]}
                        />
                        <PremiumOptionListItem
                          title="Access to one mode"
                          extraText={["Race"]}
                        />
                      </List>
                    </CardContent>
                    <CardActions>
                      <Button onClick={() => history.push(frontPagePath)}>
                        Continue with basic
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </AppContainer>
  );
};

export default BuyPremiumComponent;
