import Button from "@mui/material/Button";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import React, { useEffect, useState } from "react";
import { IFollower } from "../../classes/User";
import {
  removeFollow,
  addFollow,
  isUserFollower,
} from "../../firebase/firestoreFunctions";
import IconButton from "@mui/material/IconButton";
import { Unsubscribe } from "firebase/firestore";
import BackdropButton from "../button/BackdropButton";
import { CircularProgress } from "@mui/material";

interface IFollowButton {
  userData: IFollower;
  otherUserData: IFollower;
  onlyIcon?: boolean;
}

const FollowButton = (props: IFollowButton) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setIsLoading] = useState(true);

  const handleButtonClick = () => {
    if (isFollowing) {
      removeFollow(props.userData.uid, props.otherUserData.uid).then(() => {
        setIsLoading(false);
      });
    } else {
      addFollow(
        props.userData.uid,
        props.userData,
        props.otherUserData.uid,
        props.otherUserData
      ).then(() => {
        setIsLoading(false);
      });
    }
  };

  useEffect(() => {
    let isFollowingUnsub: Unsubscribe;
    if (props.userData?.uid && props.otherUserData) {
      isFollowingUnsub = isUserFollower(
        props.userData.uid,
        props.otherUserData.uid,
        (_isFollowing) => {
          setIsLoading(false);
          setIsFollowing(_isFollowing);
        }
      );
    }
    return () => {
      if (isFollowingUnsub) {
        isFollowingUnsub();
      }
    };
  }, [props.userData, props.otherUserData]);

  if (
    !props.userData?.uid ||
    !props.otherUserData ||
    props.userData.uid === props.otherUserData.uid
  )
    return null;

  if (loading) {
    return (
      <div style={{ textAlign: "center" }}>
        <CircularProgress />
      </div>
    );
  }

  if (props.onlyIcon) {
    return (
      <IconButton
        onClick={() => {
          setIsLoading(true);
          handleButtonClick();
        }}
      >
        {!isFollowing ? <PersonAddIcon /> : <PersonRemoveIcon />}
      </IconButton>
    );
  }

  return (
    <BackdropButton
      startIcon={!isFollowing ? <PersonAddIcon /> : <PersonRemoveIcon />}
      onClick={handleButtonClick}
    >
      {!isFollowing ? "Follow" : "Unfollow"}
    </BackdropButton>
  );
};

export default FollowButton;
