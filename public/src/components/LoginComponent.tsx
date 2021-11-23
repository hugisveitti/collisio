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
  IconButton,
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

import { Close } from "@mui/icons-material";
import { basicColor } from "../providers/theme";

interface ILoginComponent {
  setPlayerName?: Dispatch<SetStateAction<string>>;
  signInWithPopup?: boolean;
  onClose: () => void;
  backgroundColor?: string;
}

const LoginComponent = (props: ILoginComponent) => {
  const user = useContext(UserContext);

  const [creatingAccountWithEmail, setCreatingAccountWithEmail] =
    useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [isSigningIn, setIsSigningIn] = useState(true);

  const buttonWidth = 250;

  useEffect(() => {
    if (user !== null) {
      setIsSigningIn(false);
    }
  }, [user]);

  if (isSigningIn) {
    return (
      <Card
        variant="outlined"
        style={{
          backgroundColor: props.backgroundColor,
        }}
      >
        <CardContent style={{ textAlign: "center" }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      variant="outlined"
      style={{
        backgroundColor: props.backgroundColor,
      }}
    >
      <CardHeader
        title="Login"
        subheader="Login or signup with one of the methods below."
        action={
          <IconButton onClick={() => props.onClose()}>
            <Close />
          </IconButton>
        }
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
              disableElevation
              variant="contained"
              style={{
                backgroundColor: "#de5246",
                textAlign: "left",
                width: buttonWidth,
              }}
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
              <Grid item xs={12} sm={12}>
                <Button
                  disableElevation
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
              </Grid>
              <Grid item xs={12} sm={12}>
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
                  disableElevation
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
                disableElevation
                startIcon={<EmailIcon />}
                style={{
                  backgroundColor: basicColor,
                  color: "black",
                  textAlign: "left",
                  width: buttonWidth,
                }}
              >
                Sign up/in with email
              </Button>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default LoginComponent;
