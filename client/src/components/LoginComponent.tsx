import React, {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  CircularProgress,
  Input,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import GoogleIcon from "@mui/icons-material/Google";
import EmailIcon from "@mui/icons-material/Email";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import ControlPointIcon from "@mui/icons-material/ControlPoint";
import PersonIcon from "@mui/icons-material/Person";
import {
  createAccountWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut,
} from "../firebase/firebaseInit";
import { UserContext } from "../providers/UserProvider";
import { Password } from "@mui/icons-material";
import { toast } from "react-toastify";
import { privateProfilePagePath } from "./Routes";
import { Link } from "react-router-dom";

const useStyles = makeStyles({
  container: {
    width: 400,
    maxWidth: "90%",
    margin: "auto",
    marginBottom: 25,
  },
});

interface ILoginComponent {
  setPlayerName: Dispatch<SetStateAction<string>>;
}

const LoginComponent = (props: ILoginComponent) => {
  const classes = useStyles();
  const user = useContext(UserContext);

  const [creatingAccountWithEmail, setCreatingAccountWithEmail] =
    useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [isSigningIn, setIsSigningIn] = useState(true);

  useEffect(() => {
    if (user !== null) {
      setIsSigningIn(false);
    }
  }, [user]);

  if (isSigningIn) {
    return (
      <div className={classes.container}>
        <Card>
          <CardContent style={{ textAlign: "center" }}>
            <CircularProgress />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user) {
    return (
      <div className={classes.container}>
        <Card>
          <CardHeader
            subheader={<>Welcome {user.displayName ?? displayName}.</>}
            action={
              <Button
                startIcon={<LogoutIcon />}
                size="small"
                onClick={() => signOut()}
              >
                Logout
              </Button>
            }
          />
          <CardContent>
            {user.photoURL && (
              <CardMedia
                component="img"
                style={{ height: 50, width: "auto" }}
                image={user.photoURL}
              />
            )}
          </CardContent>
          <CardActions>
            <Button size="small" startIcon={<PersonIcon />} variant="outlined">
              <Link
                style={{ textDecoration: "none" }}
                to={privateProfilePagePath}
              >
                Go to profile page
              </Link>
            </Button>
          </CardActions>
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
              setIsSigningIn(true);
            }}
            variant="contained"
            style={{ backgroundColor: "#de5246", marginTop: 15 }}
            startIcon={<GoogleIcon />}
          >
            Sign in with Google
          </Button>
          {/* 
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
          </Button> */}
          <br />
          {creatingAccountWithEmail ? (
            <>
              <Input
                style={{ marginTop: 25 }}
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                style={{ marginTop: 15 }}
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={password.length < 6}
              />
              <Input
                style={{ marginTop: 15 }}
                placeholder="Displayname"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  props.setPlayerName(e.target.value);
                }}
              />
              <br />
              <br />
              <Button
                style={{ marginRight: 5 }}
                variant="contained"
                startIcon={<LoginIcon />}
                onClick={() => {
                  if (password.length < 6) {
                    toast.error("The password must be atleast 6 characters.");
                    return;
                  }
                  setIsSigningIn(true);
                  signInWithEmail(email, password);
                }}
              >
                Login
              </Button>
              <Button
                onClick={() => {
                  if (password.length < 6) {
                    toast.error("The password must be atleast 6 characters.");
                    return;
                  }
                  if (displayName === "") {
                    toast.error("The display name cannot be empty.");
                    return;
                  }
                  setIsSigningIn(true);
                  createAccountWithEmail(email, password, displayName);
                }}
                variant="outlined"
                startIcon={<ControlPointIcon />}
              >
                Sign up
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setCreatingAccountWithEmail(true)}
              variant="contained"
              startIcon={<EmailIcon />}
              style={{
                backgroundColor: "#abdbe3",
                marginTop: 15,
                color: "black",
              }}
            >
              Sign in with email
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginComponent;
