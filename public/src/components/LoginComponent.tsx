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
  Grid,
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
import { toast } from "react-toastify";
import { privateProfilePagePath } from "./Routes";
import { Link } from "react-router-dom";

const useStyles = makeStyles({
  container: {
    backgroundColor: "#da5e58",
    minWidth: 300,
  },
});

interface ILoginComponent {
  setPlayerName?: Dispatch<SetStateAction<string>>;
  signInWithPopup?: boolean;
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

  return (
    <div className={classes.container}>
      <Card variant="outlined">
        <CardHeader
          title="Login"
          subheader="Login or signup with one of the methods below."
        />

        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  signInWithGoogle(props.signInWithPopup);
                  setIsSigningIn(true);
                }}
                variant="contained"
                style={{ backgroundColor: "#de5246", marginTop: 15 }}
                startIcon={<GoogleIcon />}
              >
                Sign in with Google
              </Button>
            </Grid>

            {creatingAccountWithEmail ? (
              <React.Fragment>
                <Grid item xs={12} sm={12}>
                  <Input
                    style={{ marginTop: 25 }}
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Input
                    style={{ marginTop: 15 }}
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={password.length < 6}
                  />
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Input
                    style={{ marginTop: 15 }}
                    placeholder="Displayname"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      if (props.setPlayerName) {
                        props.setPlayerName(e.target.value);
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Button
                    style={{ marginRight: 5 }}
                    variant="contained"
                    startIcon={<LoginIcon />}
                    onClick={() => {
                      if (password.length < 6) {
                        toast.error(
                          "The password must be atleast 6 characters."
                        );
                        return;
                      }
                      setIsSigningIn(true);
                      signInWithEmail(email, password);
                    }}
                  >
                    Login
                  </Button>
                </Grid>
                <Grid item xs={6} sm={8}>
                  <Button
                    onClick={() => {
                      if (password.length < 6) {
                        toast.error(
                          "The password must be atleast 6 characters."
                        );
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
                </Grid>
              </React.Fragment>
            ) : (
              <Grid item xs={12}>
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
                  Sign up or sign in with email
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginComponent;
