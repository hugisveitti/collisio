import {
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
import React, { useContext, useEffect, useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import EditOffIcon from "@mui/icons-material/EditOff";
import { UserContext } from "../providers/UserProvider";
import { makeStyles } from "@mui/styles";
import { frontPagePath } from "./Routes";
import { Link } from "react-router-dom";
import { updateProfile } from "@firebase/auth";
import { auth } from "../firebase/firebaseInit";
import GameDataComponent from "./GameDataComponent";
import AppContainer from "../containers/AppContainer";
import { inputBackgroundColor, themeOptions } from "../providers/theme";

const useStyles = makeStyles({
  container: {
    padding: 25,
    marginTop: 0,
    backgroundColor: themeOptions.palette.secondary.dark,
  },
  input: {
    backgroundColor: themeOptions.palette.secondary.light,
  },
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
          <div style={{ margin: 15 }}>
            <Link to={frontPagePath}>Back to front page</Link>
          </div>

          {!user ? (
            <div
              style={{
                margin: 75,
                textAlign: "center",
              }}
            >
              <span>Loading your profile...</span>
              <br />
              <br />
              <CircularProgress />
            </div>
          ) : (
            <Card
              style={{
                backgroundColor: inputBackgroundColor,
              }}
            >
              {inEditMode ? renderEditInfo() : renderStaticInfo()}
            </Card>
          )}
        </Grid>

        {user && (
          <Grid
            item
            xs={12}
            sm={12}
            md={9}
            style={{ backgroundColor: "inherit" }}
          >
            <GameDataComponent userId={user.uid} />
          </Grid>
        )}
      </Grid>
    </AppContainer>
  );
};

export default PrivateProfilePage;
