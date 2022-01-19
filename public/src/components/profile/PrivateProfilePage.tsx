import { updateProfile } from "@firebase/auth";
import EditIcon from "@mui/icons-material/Edit";
import EditOffIcon from "@mui/icons-material/EditOff";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CardMedia from "@mui/material/CardMedia";
import CardActions from "@mui/material/CardActions";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import makeStyles from "@mui/styles/makeStyles";
import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import AppContainer from "../../containers/AppContainer";
import { auth, signOut } from "../../firebase/firebaseInit";
import { cardBackgroundColor } from "../../providers/theme";
import { UserContext } from "../../providers/UserProvider";
import {
  frontPagePath,
  getUserPagePath,
  privateProfileTournamentsPagePath,
} from "../Routes";
import GameDataComponent from "./GameDataComponent";
import UserSettingsComponent from "./UserSettingsComponent";
import { getDateNow } from "../../utils/utilFunctions";
import { setFirestorePublicUser } from "../../firebase/firestoreFunctions";
import { IStore } from "../store";
import BackdropContainer from "../backdrop/BackdropContainer";
import BackdropButton from "../backdrop/button/BackdropButton";

const useStyles = makeStyles({
  container: {
    padding: 25,
    marginTop: 0,
  },
  input: {},
});

interface IPrivateProfilePage {
  store: IStore;
}

const PrivateProfilePage = (props: IPrivateProfilePage) => {
  const classes = useStyles();
  const history = useHistory();
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
        <CardActions>
          <Button
            disableElevation
            variant="contained"
            onClick={() => history.push(getUserPagePath(user.uid))}
          >
            See public profile
          </Button>
        </CardActions>
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
                setFirestorePublicUser({
                  uid: user.uid,
                  displayName,
                  photoURL,
                  latestEdit: getDateNow(),
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
    <BackdropContainer backgroundContainer store={props.store}>
      <Grid
        container
        spacing={3}
        className={classes.container}
        style={{ marginTop: 0 }}
      >
        <Grid item xs={12} sm={12} md={3}>
          <Grid spacing={3} container>
            <Grid item xs={12}>
              {!user ? (
                <div
                  style={{
                    margin: 75,
                    textAlign: "center",
                  }}
                >
                  {/** TODO fix this */}
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
                    variant="outlined"
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
                <UserSettingsComponent user={user} store={props.store} />
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
              <BackdropButton
                onClick={() =>
                  signOut(() => {
                    window.location.href = frontPagePath;
                  })
                }
              >
                Logout
              </BackdropButton>
            </Grid>
            <Grid item xs={3} style={{ textAlign: "left" }}>
              <BackdropButton
                onClick={() => history.push(privateProfileTournamentsPagePath)}
              >
                Your Tournaments
              </BackdropButton>
            </Grid>
          </React.Fragment>
        )}
      </Grid>
    </BackdropContainer>
  );
};

export default PrivateProfilePage;
