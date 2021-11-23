import { updateProfile } from "@firebase/auth";
import EditIcon from "@mui/icons-material/Edit";
import EditOffIcon from "@mui/icons-material/EditOff";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  CircularProgress,
  Grid,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppContainer from "../../containers/AppContainer";
import { setDBUserProfile } from "../../firebase/firebaseFunctions";
import { auth, signOut } from "../../firebase/firebaseInit";
import {
  cardBackgroundColor,
  inputBackgroundColor,
} from "../../providers/theme";
import { UserContext } from "../../providers/UserProvider";
import { frontPagePath } from "../Routes";
import GameDataComponent from "./GameDataComponent";
import UserSettingsComponent from "./UserSettingsComponent";

const useStyles = makeStyles({
  container: {
    padding: 25,
    marginTop: 0,
  },
  input: {},
});

interface IPrivateProfilePage {}

const PrivateProfilePage = (props: IPrivateProfilePage) => {
  const classes = useStyles();
  const user = useContext(UserContext);
  const [inEditMode, setInEditMode] = useState(false);
  const [editUser, setEditUser] = useState(undefined);

  useEffect(() => {
    if (user) {
      setEditUser(user);
    }
  }, [user]);

  const renderStaticInfo = () => {
    if (!editUser) return null;
    return (
      <>
        <CardHeader
          title="Profile information"
          subheader={editUser.displayName}
          action={
            <IconButton
              onClick={() => {
                setInEditMode(true);
              }}
            >
              <EditIcon />
            </IconButton>
          }
        />
        <CardMedia component="img" image={editUser.photoURL} />
        <CardContent>
          <Grid container rowSpacing={3}>
            <Grid item xs={12}>
              <Typography>Email: {editUser.email}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>Display name: {editUser.displayName}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </>
    );
  };

  const updateEditUser = (value: string, key: string) => {
    const newEditUser = { ...editUser };
    newEditUser[key] = value;
    setEditUser(newEditUser);
  };

  const renderEditInfo = () => {
    return (
      <React.Fragment>
        <CardHeader
          action={
            <IconButton
              onClick={() => {
                setInEditMode(false);
                const { displayName, photoURL } = editUser;
                updateProfile(auth.currentUser, { displayName, photoURL });
                setDBUserProfile(user.uid, {
                  uid: user.uid,
                  displayName,
                  photoURL,
                });
                if (user.displayName !== displayName) {
                  // TODO: fix this, so we don't need to reload when
                  // changing display name, this is neccecary because the name in the AppContianer doesnt change
                  window.location.reload();
                }
              }}
            >
              <EditOffIcon />
            </IconButton>
          }
        />
        <CardContent>
          <Grid container rowSpacing={3}>
            <Grid item xs={12}>
              <TextField
                autoComplete="false"
                className={classes.input}
                label="Photo URL"
                variant="outlined"
                id="photo-url"
                value={editUser.photoURL ?? ""}
                onChange={(e) => updateEditUser(e.target.value, "photoURL")}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                autoComplete="false"
                id="display-name"
                variant="outlined"
                label="Display name"
                value={editUser.displayName ?? ""}
                onChange={(e) => {
                  updateEditUser(e.target.value, "displayName");
                }}
                className={classes.input}
              />
            </Grid>
          </Grid>
        </CardContent>
      </React.Fragment>
    );
  };

  return (
    <AppContainer>
      <Grid
        container
        spacing={3}
        className={classes.container}
        style={{ marginTop: 0 }}
      >
        <Grid item xs={12} sm={12} md={3}>
          <Grid spacing={3} container>
            <Grid item xs={12}>
              {/* <div style={{ margin: 15 }}>
                <Link to={frontPagePath}>Back to front page</Link>
              </div> */}

              {!user ? (
                <div
                  style={{
                    margin: 75,
                    textAlign: "center",
                  }}
                >
                  <Typography>Loading your profile...</Typography>
                  <br />
                  <br />
                  <Typography>You might not be logged in...</Typography>
                  <br />
                  <br />
                  <CircularProgress />
                </div>
              ) : (
                <>
                  <Card
                    style={{
                      backgroundColor: cardBackgroundColor,
                    }}
                  >
                    {inEditMode ? renderEditInfo() : renderStaticInfo()}
                  </Card>
                </>
              )}
            </Grid>

            {user && (
              <Grid item xs={12}>
                <UserSettingsComponent userId={user.uid} />
              </Grid>
            )}
          </Grid>
        </Grid>

        {user && (
          <React.Fragment>
            <Grid
              item
              xs={12}
              sm={12}
              md={9}
              style={{ backgroundColor: "inherit" }}
            >
              <GameDataComponent userId={user.uid} />
            </Grid>
            <Grid item xs={3} style={{ textAlign: "left" }}>
              <Button
                color="inherit"
                onClick={signOut}
                variant="contained"
                disableElevation
              >
                Logout
              </Button>
            </Grid>
          </React.Fragment>
        )}
      </Grid>
    </AppContainer>
  );
};

export default PrivateProfilePage;
