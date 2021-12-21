import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router";
import { toast } from "react-toastify";
import { IEndOfRaceInfoPlayer } from "../../classes/Game";
import { IFollower, IPublicUser } from "../../classes/User";
import AppContainer from "../../containers/AppContainer";
import {
  getFirestorePublicUser,
  getUserSocials,
} from "../../firebase/firestoreFunctions";
import { getPlayerBestScores } from "../../firebase/firestoreGameFunctions";
import { UserContext } from "../../providers/UserProvider";
import { frontPagePath } from "../Routes";
import PublicProfilePageComponent from "./PublicProfilePageComponent";

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
  const [bestRaces, setBestRaces] = useState([] as IEndOfRaceInfoPlayer[]);

  useEffect(() => {
    if (profileId) {
      getFirestorePublicUser(profileId, (res) => {
        if (res.status === "success") {
          setProfile(res.data);
        } else {
          toast.error(res.message);

          /** toast doesnt appear */
          history.push(frontPagePath);
        }
      });
      getPlayerBestScores(profileId, (data) => {
        if (data) {
          setBestRaces(data);
        }
      });
    }
  }, [profileId]);

  useEffect(() => {
    if (profile) {
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
            bestRaces={bestRaces}
          />
        )}
      </Grid>
    </AppContainer>
  );
};

export default PublicProfilePageContainer;
