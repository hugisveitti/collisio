import React from "react";

import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import { IFollower, IPublicUser, IUser } from "../../classes/User";
import { cardBackgroundColor } from "../../providers/theme";
import Button from "@mui/material/Button";
import { addFollow, removeFollow } from "../../firebase/firestoreFunctions";
import FollowButton from "./FollowButton";

interface IPublicProfilePageComponent {
  profile: IPublicUser;
  user: IUser;
  followings: IFollower[];
  followers: IFollower[];
}

const PublicProfilePageComponent = (props: IPublicProfilePageComponent) => {
  const userData: IFollower = {
    displayName: props.user?.displayName,
    uid: props.user?.uid,
    photoURL: props.user?.photoURL,
  };
  const followingData: IFollower = {
    displayName: props.profile.displayName,
    uid: props.profile.uid,
    photoURL: props.profile.photoURL,
  };
  return (
    <>
      <Grid item xs={12} lg={6}>
        <Card
          variant="outlined"
          style={{
            backgroundColor: cardBackgroundColor,
          }}
        >
          <CardHeader
            header={props.profile.displayName}
            title={props.profile.displayName}
            subheader={`Last logged in ${props.profile.latestLogin.slice(
              0,
              10
            )}`}
            action={
              <FollowButton userData={userData} otherUserData={followingData} />
            }
          />
          <CardContent>
            <Typography>{props.followers.length} followers</Typography>
          </CardContent>
          <CardContent>
            <Typography>{props.followings.length} following</Typography>
          </CardContent>
          {props.profile.photoURL ? (
            <CardMedia
              style={{
                width: 400,
                maxWidth: "100%",
                margin: "auto",
              }}
              src={props.profile.photoURL}
              component="img"
            />
          ) : (
            <Typography>No profile image</Typography>
          )}
        </Card>
      </Grid>

      <Grid item xs={12} lg={6}>
        <Typography>Race info</Typography>
      </Grid>
    </>
  );
};

export default PublicProfilePageComponent;
