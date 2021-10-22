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
import React, { useContext, useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import HelpIcon from "@mui/icons-material/Help";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { UserContext } from "../providers/UserProvider";
import { signOut } from "../firebase/firebaseInit";
import { useHistory } from "react-router";
import {
  frontPagePath,
  highscorePagePath,
  howToPlayPagePath,
  privateProfilePagePath,
} from "../components/Routes";
import LoginComponent from "../components/LoginComponent";
import { ToastContainer } from "react-toastify";

interface IAppContainer {
  children: JSX.Element | JSX.Element[];
}

const AppContainer = (props: IAppContainer) => {
  const user = useContext(UserContext);
  const history = useHistory();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

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
          <Button color="inherit" onClick={signOut}>
            Logout
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
