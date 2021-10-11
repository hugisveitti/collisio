import React, { useContext } from "react";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import GoogleIcon from "@mui/icons-material/Google";
import FacebookIcon from "@mui/icons-material/Facebook";
import {
  auth,
  signInWithFacebook,
  signInWithGoogle,
  signOut,
} from "../firebase/firebaseFunctions";
import { UserContext } from "../providers/UserProvider";

const useStyles = makeStyles({
  container: {
    width: 300,
    maxWidth: "80%",
    margin: "auto",
    marginBottom: 25,
  },
});

const LoginComponent = () => {
  const classes = useStyles();
  const user = useContext(UserContext);
  console.log("user", user);
  const u = auth.currentUser;
  console.log("u", u);

  if (user) {
    return (
      <div className={classes.container}>
        <Card>
          <CardContent>
            {user.photoURL && (
              <CardMedia
                component="img"
                style={{ height: 50, width: "auto" }}
                image={user.photoURL}
              />
            )}
            <Typography color="text.secondary">
              Welcome {user.displayName}.
            </Typography>

            <CardActions>
              <Button size="small" onClick={() => signOut()}>
                Logout
              </Button>
            </CardActions>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" component="div">
            Login
          </Typography>
          <Typography>
            To be able to save your highscore you need to login.
          </Typography>
          <Button
            onClick={(e) => {
              e.preventDefault();
              signInWithGoogle();
            }}
            variant="contained"
            style={{ backgroundColor: "#de5246", marginTop: 15 }}
            startIcon={<GoogleIcon />}
          >
            Sign in with Google
          </Button>
          <br />
          <Button
            onClick={(e) => {
              e.preventDefault();
              signInWithFacebook();
            }}
            style={{ backgroundColor: "#4267B2", marginTop: 15 }}
            startIcon={<FacebookIcon />}
            variant="contained"
          >
            Sign in with Facebook
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginComponent;
