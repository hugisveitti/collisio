import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Collapse from "@mui/material/Collapse";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { useHistory } from "react-router";
import { toast } from "react-toastify";
import {
  activeGameTypes,
  activeTrackNames,
  getGameTypeNameFromType,
  getTrackNameFromType,
} from "../../classes/Game";
import { basicColor, premiumColor, standardColor } from "../../providers/theme";
import { defaultVehicleType } from "../../shared-backend/shared-stuff";
import {
  activeVehicleTypes,
  getVehicleNameFromType,
} from "../../vehicles/VehicleConfigs";
import BackdropContainer from "../backdrop/BackdropContainer";
import BackdropButton from "../button/BackdropButton";
import MyCard from "../card/MyCard";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import { frontPagePath } from "../Routes";

interface IPremiumOptionListItem {
  title: string;
  listText: string[];
  extraText?: string;
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
          {props.listText.map((t) => (
            <ListItem key={t} style={{ paddingLeft: 25 }}>
              <ListItemText key={t} primary={`- ${t}`} />
            </ListItem>
          ))}
        </List>
        {props.extraText && <Typography>{props.extraText} </Typography>}
      </Collapse>
    </>
  );
};

interface IBuyPremiumComponent {}

const BuyPremiumComponent = (props: IBuyPremiumComponent) => {
  const history = useHistory();

  const allGameModes = ["Race", "Tag"];

  return (
    <BackdropContainer>
      <Grid container spacing={3} style={{ color: "black" }}>
        <Grid item xs={12} md={4} xl={1}>
          <ToFrontPageButton />
        </Grid>
        <Grid item xs={12} md={8} xl={11}>
          <Typography variant="h2" component="div">
            Choose plan
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h5" component="div">
            <MyCard>
              <CardContent>
                You can either buy a premium account or continue using a free
                account.
              </CardContent>
            </MyCard>
          </Typography>
        </Grid>

        <Grid item xs={12} sm={4}>
          <MyCard style={{ backgroundColor: premiumColor }}>
            <CardHeader
              title="Full game"
              header="Full game"
              subheader="$10 one time payment, all future updates included"
            />
            <CardContent>
              <List>
                <PremiumOptionListItem
                  title="Access to all maps"
                  listText={activeTrackNames.map((tn) =>
                    getTrackNameFromType(tn)
                  )}
                />
                <PremiumOptionListItem
                  title="Access to all vehicles"
                  listText={activeVehicleTypes.map((v) => v.name)}
                />
                <PremiumOptionListItem
                  title="Access to game modes"
                  listText={activeGameTypes.map((gt) =>
                    getGameTypeNameFromType(gt)
                  )}
                />
                <PremiumOptionListItem
                  title="More info"
                  extraText="The full game includes more features, such as the tournament feature, buying trophies."
                  listText={[]}
                />
              </List>
            </CardContent>
            <CardActions>
              <BackdropButton
                onClick={() => toast("Premium not available yet")}
              >
                Buy Premium
              </BackdropButton>
            </CardActions>
          </MyCard>
        </Grid>

        <Grid item xs={12} sm={4}>
          <MyCard style={{ backgroundColor: standardColor }}>
            <CardHeader
              title="Standard"
              header="Standard"
              subheader="$2.5 one time payment, you can use the vehicles when playing split screen with a friend who owns premium maps."
            />
            <CardContent>
              <List>
                <PremiumOptionListItem
                  title="Access to one map"
                  listText={["Farm"]}
                />
                <PremiumOptionListItem
                  title="Access to all vehicles"
                  listText={activeVehicleTypes.map((v) => v.name)}
                />
                <PremiumOptionListItem
                  title="Access to one game mode"
                  listText={["Race"]}
                />
                <PremiumOptionListItem
                  title="More info"
                  extraText="The standard plan includes the option of participating in a tournament but not creating one."
                  listText={[]}
                />
              </List>
            </CardContent>
            <CardActions>
              <BackdropButton
                onClick={() => toast("Standard not available yet")}
              >
                Buy Standard
              </BackdropButton>
            </CardActions>
          </MyCard>
        </Grid>

        <Grid item xs={12} sm={4}>
          <MyCard style={{ backgroundColor: basicColor }}>
            <CardHeader title="Basic" header="Basic" subheader="Free" />
            <CardContent>
              <List>
                <PremiumOptionListItem
                  title="Access to one map"
                  listText={[getTrackNameFromType("farm-track")]}
                />
                <PremiumOptionListItem
                  title="Access to one vehicle"
                  listText={[getVehicleNameFromType(defaultVehicleType)]}
                />
                <PremiumOptionListItem
                  title="Access to one mode"
                  listText={["Race"]}
                />
              </List>
            </CardContent>
            <CardActions>
              <BackdropButton onClick={() => history.push(frontPagePath)}>
                Continue with basic
              </BackdropButton>
            </CardActions>
          </MyCard>
        </Grid>
      </Grid>
    </BackdropContainer>
  );
};

export default BuyPremiumComponent;
