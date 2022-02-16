import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CardMedia from "@mui/material/CardMedia";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import alphaGIF from "../images/alpha.gif";
import betaGIF from "../images/beta.gif";
import connectWithLogin from "../images/connect-with-login.PNG";
import connectWithRoomId from "../images/connect-with-roomid.PNG";
import gameplayImage from "../images/gameplay.PNG";
import gammaGIF from "../images/gamma.gif";
import mobileGUI from "../images/mobile-gui.PNG";
import leftTurnImage from "../images/phone-orientation-leftTurn.PNG";
import noTurnImage from "../images/phone-orientation-noTurn.PNG";
import rightTurnImage from "../images/phone-orientation-rightTurn.PNG";
import resetOrientation from "../images/resetorient.jpg";
import splitScreenImage from "../images/split-screen.PNG";
import vehicleSelect1 from "../images/vehicle-select-1.PNG";
import vehicleSelect2 from "../images/vehicle-select-2.PNG";
import "../styles/main.css";
import BackdropContainer from "./backdrop/BackdropContainer";
import BackdropButton from "./button/BackdropButton";
import MyCard from "./card/MyCard";
import ToFrontPageButton from "./inputs/ToFrontPageButton";
import {
  buyCoinsPagePath,
  buyPremiumPagePath,
  garagePagePath,
  highscorePagePath,
} from "./Routes";

interface IHowToPlayItem {
  header: string;
  children: JSX.Element;
}
const HowToPlayItem = (props: IHowToPlayItem) => {
  const [open, setOpen] = useState(false);

  return (
    <Grid item xs={12}>
      <MyCard
        style={{ cursor: "pointer" }}
        //  style={{ backgroundColor: "rgba(255,255,255,.82)" }}
        // variant="outlined"
      >
        <CardHeader
          onClick={() => setOpen(!open)}
          subheader={props.header}
          action={
            <IconButton>
              {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          }
        />
        <Collapse in={open}>
          <CardContent>{props.children}</CardContent>
        </Collapse>
      </MyCard>
    </Grid>
  );
};

interface IHowToPlayProps {}

const HowToPlayPage = (props: IHowToPlayProps) => {
  const history = useHistory();
  return (
    <BackdropContainer backgroundContainer>
      <Grid
        container
        spacing={1}
        style={{ maxWidth: 600, width: "95%", margin: "auto" }}
      >
        <Grid item xs={12}>
          <Typography variant="h4" component="div">
            How to play
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <ToFrontPageButton />
        </Grid>

        <HowToPlayItem header="Connecting to a room">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography>
                During this tutorial we will talk about rooms and games. You
                create a room on your desktop browser and then on your mobile
                you connect to that room. Upto four people can connect to a room
                at the same time. Many games can be played in one room.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                There are a few ways to create a room. First on your desktop
                press "Create game", this button is only visible on your
                desktop, not your mobile.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>Logging in on both mobile and desktop</Typography>
            </Grid>
            <Grid item xs={12}>
              <CardMedia src={connectWithLogin} component="img" />
            </Grid>
            <Grid item xs={12}>
              <Typography>
                If you are logged in on the same account on your phone and
                desktop, then after creating a game on your desktop you can see
                the game on your mobile on the frontpage.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Divider variant="middle" />
            </Grid>

            <Grid item xs={12}>
              <Typography>Scanning the QR code</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                After creating a game a QR code is generated for that room,
                which you can scan with your phone to enter the room.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Divider variant="middle" />
            </Grid>

            <Grid item xs={12}>
              <Typography>Entering the room id</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                You can enter the room id into the "Room id" input area on your
                mobile. Alternatively you can copy the link and paste it into
                your phone's browser.
              </Typography>
            </Grid>
          </Grid>
        </HowToPlayItem>

        <HowToPlayItem header="Game play">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography>
                The game works by using your phone to steer a vehicle that is
                displayed on a desktop. The idea is to simulate driving a real
                vehicle, so grab your phone as you would grap a steering wheel.
              </Typography>
              <Typography color="InfoText">
                You then compete against your friends for highscores.
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider variant="middle" />
            </Grid>

            <Grid item xs={12}>
              <Typography component="h3">The desktop</Typography>
            </Grid>
            <Grid item xs={12}>
              <CardMedia src={gameplayImage} component="img" />
            </Grid>
            <Grid item xs={12}>
              <Typography>
                On your desktop computer (or tablet) you will see the above
                image.
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider variant="middle" />
            </Grid>

            <Grid item xs={12}>
              <Typography component="h3">
                The controller (your mobile)
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <CardMedia src={mobileGUI} component="img" />
            </Grid>
            <Grid item xs={12}>
              <Typography>
                The controller looks like the image above. There are four
                buttons, 'F', 'B', 'reset' and 'settings / pause'
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <List>
                <ListItem>
                  <ListItemText
                    primary="F"
                    secondary="F stands for Forward, you can think of it like an accelerator"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="B"
                    secondary="B stands for break or backwards. When going forward it works like a break. When you are still it works like the reverse gear."
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Reset"
                    secondary="If your vehicle goes in some unwanted state such as lands on its back or gets stuck, the pressing the reset button will get you back to a checkpoint position. When the race is over the restart button will restart the game"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Settings"
                    secondary="If you would like to change some settings such as steering sensitivity these can be changed in the settings."
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                It is recommended that your phone is locked in portait mode.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                There have been some issues with mobile browsers and the
                orientation, the game works on Google Chrome and Safari on iOS.
              </Typography>
            </Grid>
          </Grid>
        </HowToPlayItem>

        <HowToPlayItem header="Steering">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <img src={noTurnImage} className="info-image-small" alt="" />
            </Grid>
            <Grid item xs={12}>
              <Typography>
                To begin with align your phone like the image above.
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider variant="middle" />
            </Grid>

            <Grid item xs={12}>
              <img src={leftTurnImage} className="info-image-small" alt="" />
            </Grid>
            <Grid item xs={12}>
              <Typography>
                To turn left tilt your phone like in the image. This is to
                emulate a steering wheel in a car.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Divider variant="middle" />
            </Grid>
            <Grid item xs={12}>
              <img src={rightTurnImage} className="info-image-small" alt="" />
            </Grid>
            <Grid item xs={12}>
              <Typography>
                To turn right tilt your phone like in the image above.
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider variant="middle" />
            </Grid>
            <Grid item xs={12}>
              <Typography component="h3">More on Steering</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                Your phone knows about its orientation relative to the world.
                There are 3 axis your phone can rotate by and there correspond
                to value, these values and axis are:
              </Typography>
            </Grid>
            <Grid item xs={12}>
              Beta
            </Grid>
            <Grid item xs={12}>
              <CardMedia src={betaGIF} component="img" />
            </Grid>

            <Grid item xs={12}>
              <Divider variant="middle" />
            </Grid>

            <Grid item xs={12}>
              Alpha
            </Grid>
            <Grid item xs={12}>
              <CardMedia src={alphaGIF} component="img" />
            </Grid>

            <Grid item xs={12}>
              <Divider variant="middle" />
            </Grid>

            <Grid item xs={12}>
              Gamma
            </Grid>
            <Grid item xs={12}>
              <CardMedia src={gammaGIF} component="img" />
            </Grid>
            <Grid item xs={12}>
              <Typography>
                The vehicle is steered by turing your phone like demonstrated in
                the first image, so the beta value dictates the steering.
              </Typography>
            </Grid>
          </Grid>
        </HowToPlayItem>

        <HowToPlayItem header="Steering problems">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography>
                Sometimes your browser revokes the permission to use the phones
                orientation.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                To re grant the permission you go into setting while in game and
                press the "Reset orienation" button.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <CardMedia src={resetOrientation} component="img" />
            </Grid>
            <Grid item xs={12}>
              <Typography>
                If that does not work, try changing browsers on your mobile. Try
                Google Chrome, Safari or Firefox.
              </Typography>
            </Grid>
          </Grid>
        </HowToPlayItem>

        <HowToPlayItem header="Selecting vehicles">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography>
                To select a different vehicle, when in the waiting room, go to
                the bottom and select your vehicle of choice. Note to select
                vehicles other than the "normal" you will have to have a premium
                account (which currently is just being logged in).
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <CardMedia src={vehicleSelect1} component="img" />
            </Grid>
            <Grid item xs={12}>
              <Typography>
                After pressing vehicles you can select your desired vehicle.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <CardMedia src={vehicleSelect2} component="img" />
            </Grid>
          </Grid>
        </HowToPlayItem>

        <HowToPlayItem header="In-game settings and pausing a game">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography>
                While in game, then you can press the 'Escape' (Esc) key on your
                keyboard to pause the game and bring up a small menu.
              </Typography>
            </Grid>
          </Grid>
        </HowToPlayItem>

        <HowToPlayItem header="Playing split screen">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography>
                To play split screen, make upto four players connect to the same
                room.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                Playing splitscreen can be demanding for your computer, so you
                might want to close all other applications.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <CardMedia src={splitScreenImage} component="img" />
            </Grid>
          </Grid>
        </HowToPlayItem>

        <HowToPlayItem header="Highscore">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography>
                If you are logged in, then your score will automatically be
                recorded on the highscore charts which can be viewed on the{" "}
                <Link to={highscorePagePath}>highscore page</Link>
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                The highscores are sorted in a way such that each 'track' &
                'number-of-laps' pair has its own highscore list.
              </Typography>
            </Grid>
          </Grid>
        </HowToPlayItem>

        <HowToPlayItem header="Maps, vehicles and game types">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography>
                There are various race tracks, game modes, vehicles and vehicle
                upgrades. You can upgrade your vehicle in the garage, buy buying
                items. You buy items with coins. You can either earn coins by
                racing or you can buy them.
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <BackdropButton link={buyCoinsPagePath}>Buy coins</BackdropButton>
            </Grid>
            <Grid item xs={6}>
              <BackdropButton link={garagePagePath}>
                Go to garage
              </BackdropButton>
            </Grid>
          </Grid>
        </HowToPlayItem>

        <HowToPlayItem header="Tips">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography>
                To make the game run smoother, close all applications on your
                computer, all other tabs in your browser and have your computer
                plugged in.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                You can also put the graphics in low settings and turn off
                shadow, and lower your targetFPS.
              </Typography>
            </Grid>
          </Grid>
        </HowToPlayItem>

        <Grid item xs={12}>
          <iframe
            src="https://www.youtube.com/embed/0YBLvMXrdPo"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{ margin: "auto", display: "block" }}
            allowFullScreen
          ></iframe>
        </Grid>
        <Grid item xs={12}>
          <iframe
            src="https://www.youtube.com/embed/CNxlUfQencs"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{ margin: "auto", display: "block" }}
            allowFullScreen
          ></iframe>
        </Grid>
      </Grid>
    </BackdropContainer>
  );
};

export default HowToPlayPage;
