import Grid from "@mui/material/Grid";
import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router";
import { IFollower, IPublicUser } from "../../classes/User";
import AppContainer from "../../containers/AppContainer";
import {
  getFirestorePublicUser,
  getUserSocials,
  isUserFollower,
} from "../../firebase/firestoreFunctions";
import { toast } from "react-toastify";
import { frontPagePath } from "../Routes";
import PublicProfilePageComponent from "./PublicProfilePageComponent";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { UserContext } from "../../providers/UserProvider";
import { Unsubscribe } from "@firebase/firestore";

interface PublicProfileParamType {
  profileId: string;
}

interface IPublicProfilePageContainer {}

const PublicProfilePageContainer = (props: IPublicProfilePageContainer) => {
  const params = useParams<PublicProfileParamType>();
  const history = useHistory();
  const profileId = params?.profileId;
  const [profile, setProfile] = useState(undefined as IPublicUser);

  const user = useContext(UserContext);
  const [followers, setFollowers] = useState([] as IFollower[]);
  const [followings, setFollowings] = useState([] as IFollower[]);

  useEffect(() => {
    if (profileId) {
      getFirestorePublicUser(profileId, (res) => {
        if (res.status === "success") {
          setProfile(res.data);
        } else {
          toast.error(res.message);
          setTimeout(() => {
            /** toast doesnt appear */
            history.push(frontPagePath);
          }, 3000);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (profile) {
      console.log("profile.uid", profile.uid);
      getUserSocials(
        profile.uid,
        (_followers) => setFollowers(_followers),
        (_followings) => setFollowings(_followings)
      );
    }
  }, [profile]);

  return (
    <AppContainer>
      <Grid container spacing={3}>
        {!profile ? (
          <>
            <Grid item xs={12}>
              <CircularProgress />
            </Grid>
            <Grid item xs={12}>
              <Typography>Loading profile...</Typography>
            </Grid>
          </>
        ) : (
          <PublicProfilePageComponent
            user={user}
            profile={profile}
            followers={followers}
            followings={followings}
          />
        )}
      </Grid>
    </AppContainer>
  );
};

export default PublicProfilePageContainer;
