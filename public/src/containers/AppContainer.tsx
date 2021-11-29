import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import HelpIcon from "@mui/icons-material/Help";
import MenuIcon from "@mui/icons-material/Menu";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import StarsIcon from "@mui/icons-material/Stars";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Modal from "@mui/material/Modal";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { ToastContainer } from "react-toastify";
import CookiePrompt from "../components/monitary/CookiePrompt";
import LoginComponent from "../components/LoginComponent";
import {
  buyPremiumPagePath,
  frontPagePath,
  highscorePagePath,
  howToPlayPagePath,
  privateProfilePagePath,
  showRoomPagePath,
} from "../components/Routes";
import { containerBackgroundColor } from "../providers/theme";
import { UserContext } from "../providers/UserProvider";
import "react-toastify/dist/ReactToastify.css";

interface IAppContainer {
  children: JSX.Element | JSX.Element[];
  containerStyles?: React.CSSProperties;
}

const AppContainer = (props: IAppContainer) => {
  const history = useHistory();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const user = useContext(UserContext);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setLoginModalOpen(false);
    }
  }, [user]);

  const renderLoginLogoutButton = () => {
    if (user) {
      return (
        <React.Fragment>
          <Button
            color="inherit"
            startIcon={<AccountCircleIcon />}
            onClick={() => history.push(privateProfilePagePath)}
          >
            <Typography
              variant="subtitle1"
              component="span"
              sx={{ flexGrow: 1 }}
            >
              {user.displayName}
            </Typography>
          </Button>
        </React.Fragment>
      );
    }
    return (
      <Button color="inherit" onClick={() => setLoginModalOpen(true)}>
        Login
      </Button>
    );
  };

  return (
    <React.Fragment>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1 }}
              onClick={() => history.push(frontPagePath)}
            >
              Collisio
            </Typography>
            {renderLoginLogoutButton()}
          </Toolbar>
        </AppBar>
      </Box>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 250 }} onClick={() => setDrawerOpen(false)}>
          <List>
            <ListItem button onClick={() => history.push(howToPlayPagePath)}>
              <ListItemIcon>
                <HelpIcon />
              </ListItemIcon>
              <ListItemText primary="How to play" />
            </ListItem>
            <ListItem button onClick={() => history.push(highscorePagePath)}>
              <ListItemIcon>
                <SportsScoreIcon />
              </ListItemIcon>
              <ListItemText primary="Highscores" />
            </ListItem>
            <ListItem button onClick={() => history.push(showRoomPagePath)}>
              <ListItemIcon>
                <DirectionsCarIcon />
              </ListItemIcon>
              <ListItemText primary="Car room" />
            </ListItem>
            <ListItem button onClick={() => history.push(buyPremiumPagePath)}>
              <ListItemIcon>
                <StarsIcon />
              </ListItemIcon>
              <ListItemText primary="Go Premium" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Modal open={loginModalOpen} onClose={() => setLoginModalOpen(false)}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <LoginComponent onClose={() => setLoginModalOpen(false)} />
        </div>
      </Modal>
      <div
        style={{
          backgroundColor: containerBackgroundColor,
          paddingTop: 25,
          paddingLeft: 10,
          paddingRight: 10,
          paddingBottom: 10,
          textAlign: "center",
          ...props.containerStyles,
        }}
      >
        {props.children}
      </div>
      <ToastContainer />
      <CookiePrompt />
    </React.Fragment>
  );
};

export default AppContainer;
