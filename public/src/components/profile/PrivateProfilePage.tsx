import { updateProfile } from "@firebase/auth";
import EditIcon from "@mui/icons-material/Edit";
import EditOffIcon from "@mui/icons-material/EditOff";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CardMedia from "@mui/material/CardMedia";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { auth, signOut } from "../../firebase/firebaseInit";
import { setFirestorePublicUser } from "../../firebase/firestoreFunctions";
import { UserContext } from "../../providers/UserProvider";
import { getDateNow } from "../../utils/utilFunctions";
import BackdropContainer from "../backdrop/BackdropContainer";
import BackdropButton from "../button/BackdropButton";
import MyCard from "../card/MyCard";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import {
  frontPagePath,
  getUserPagePath,
  privateProfileTournamentsPagePath,
} from "../Routes";
import { IStore } from "../store";
import MyTextField from "../textField/MyTextField";
import GameDataComponent from "./GameDataComponent";
import UserSettingsComponent from "./UserSettingsComponent";

interface IPrivateProfilePage {
  store: IStore;
}

const PrivateProfilePage = (props: IPrivateProfilePage) => {
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
            <BackdropButton
              startIcon={<EditIcon />}
              onClick={() => {
                setInEditMode(true);
              }}
            >
              Edit
            </BackdropButton>
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
          <BackdropButton link={getUserPagePath(user.uid)}>
            See public profile
          </BackdropButton>
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
            <BackdropButton
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
              startIcon={<EditOffIcon />}
            >
              Submit Edit
            </BackdropButton>
          }
        />
        <CardContent>
          <Grid container rowSpacing={3}>
            <Grid item xs={12}>
              <MyTextField
                label="Photo URL"
                id="photo-url"
                value={editUser.photoURL ?? ""}
                onChange={(e) => updateEditUser(e.target.value, "photoURL")}
              />
            </Grid>
            <Grid item xs={12}>
              <MyTextField
                id="display-name"
                label="Display name"
                value={editUser.displayName ?? ""}
                onChange={(e) => {
                  updateEditUser(e.target.value, "displayName");
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </React.Fragment>
    );
  };

  return (
    <BackdropContainer store={props.store}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ToFrontPageButton />
        </Grid>
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
                  {/* <Typography>You might not be logged in...</Typography> */}
                  <br />
                  <br />
                  <CircularProgress />
                </div>
              ) : (
                <>
                  <MyCard>
                    {inEditMode ? renderEditInfo() : renderStaticInfo()}
                  </MyCard>
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
