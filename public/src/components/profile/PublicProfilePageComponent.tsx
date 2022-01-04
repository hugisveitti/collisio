import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CardMedia from "@mui/material/CardMedia";
import Collapse from "@mui/material/Collapse";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { useHistory } from "react-router";
import { IEndOfRaceInfoPlayer } from "../../classes/Game";
import { IFollower, IPublicUser, IUser } from "../../classes/User";
import { cardBackgroundColor } from "../../providers/theme";
import HighscoreTable from "../highscore/HighscoreTable";
import { getUserPagePath } from "../Routes";
import FollowButton from "./FollowButton";

interface IPublicProfilePageComponent {
  profile: IPublicUser;
  user: IUser;
  followings: IFollower[];
  followers: IFollower[];
  bestRaces: IEndOfRaceInfoPlayer[];
}

const PublicProfilePageComponent = (props: IPublicProfilePageComponent) => {
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingsOpen, setFollowingsOpen] = useState(false);

  const history = useHistory();
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

  const lastLogin =
    typeof props.profile.latestLogin === "number"
      ? new Date(props.profile.latestLogin).toISOString()
      : "-";
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
            subheader={`Last logged in ${lastLogin ?? "-"}`}
            action={
              <FollowButton userData={userData} otherUserData={followingData} />
            }
          />
          <CardContent>
            <Button onClick={() => setFollowersOpen(!followersOpen)}>
              {props.followers.length} followers
            </Button>
            <Collapse in={followersOpen}>
              <List>
                {props.followers.map((f) => (
                  <ListItemButton
                    key={f.uid}
                    onClick={() => history.push(getUserPagePath(f.uid))}
                  >
                    {f.displayName}
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </CardContent>
          <CardContent>
            <Button onClick={() => setFollowingsOpen(!followingsOpen)}>
              {props.followings.length} following
            </Button>

            <Collapse in={followingsOpen}>
              <List>
                {props.followings.map((f) => (
                  <ListItemButton
                    key={f.uid}
                    onClick={() => history.push(getUserPagePath(f.uid))}
                  >
                    {f.displayName}
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
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
        <Typography>Best races</Typography>
        <HighscoreTable
          data={props.bestRaces}
          noDataText="User hasn't completed any races"
          includeTrackAndNumLaps
        />
      </Grid>
    </>
  );
};

export default PublicProfilePageComponent;
