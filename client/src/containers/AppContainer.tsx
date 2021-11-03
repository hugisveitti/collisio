import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  List,
  ListItemText,
  ListItem,
  ListItemIcon,
  Modal,
} from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import HelpIcon from "@mui/icons-material/Help";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

import { useHistory } from "react-router";
import {
  frontPagePath,
  highscorePagePath,
  howToPlayPagePath,
  privateProfilePagePath,
  showRoomPagePath,
} from "../components/Routes";
import LoginComponent from "../components/LoginComponent";
import { ToastContainer } from "react-toastify";
import { IUser } from "../firebase/firebaseFunctions";
import { UserContext } from "../providers/UserProvider";

interface IAppContainer {
  children: JSX.Element | JSX.Element[];
}

const AppContainer = (props: IAppContainer) => {
  const history = useHistory();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const user = useContext(UserContext);
  useEffect(() => {
    console.log("user display name changed");
  }, [user?.displayName]);

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

            backgroundColor: "#eeebdf",
            border: "2px solid #000",
          }}
        >
          <LoginComponent />
        </div>
      </Modal>

      {props.children}
      <ToastContainer />
    </React.Fragment>
  );
};

export default AppContainer;
