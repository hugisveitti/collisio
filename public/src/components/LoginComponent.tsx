import CloseIcon from "@mui/icons-material/Close";
import ControlPointIcon from "@mui/icons-material/ControlPoint";
import EmailIcon from "@mui/icons-material/Email";
import GoogleIcon from "@mui/icons-material/Google";
import LoginIcon from "@mui/icons-material/Login";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Input from "@mui/material/Input";

import React, {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import {
  createAccountWithEmail,
  signInWithEmail,
  signInWithGoogle,
} from "../firebase/firebaseInit";
import { basicColor } from "../providers/theme";
import { UserContext } from "../providers/UserProvider";

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
            <CloseIcon />
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
                    signInWithEmail(email, password, (status, message) => {
                      if (status === "error") {
                        setIsSigningIn(false);
                        toast.error(message);
                      }
                    });
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
