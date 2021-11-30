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

interface IFollowButton {
  userData: IFollower;
  otherUserData: IFollower;
  onlyIcon?: boolean;
}

const FollowButton = (props: IFollowButton) => {
  const [isFollowing, setIsFollowing] = useState(false);

  const handleButtonClick = () => {
    if (isFollowing) {
      removeFollow(props.userData.uid, props.otherUserData.uid);
    } else {
      addFollow(
        props.userData.uid,
        props.userData,
        props.otherUserData.uid,
        props.otherUserData
      );
    }
  };

  useEffect(() => {
    let isFollowingUnsub: Unsubscribe;
    if (props.userData && props.otherUserData) {
      isFollowingUnsub = isUserFollower(
        props.userData.uid,
        props.otherUserData.uid,
        (_isFollowing) => {
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
    !props.userData ||
    !props.otherUserData ||
    props.userData.uid === props.otherUserData.uid
  )
    return null;

  if (props.onlyIcon) {
    return (
      <IconButton onClick={handleButtonClick}>
        {!isFollowing ? <PersonAddIcon /> : <PersonRemoveIcon />}
      </IconButton>
    );
  }

  return (
    <Button
      disableElevation
      variant="contained"
      startIcon={!isFollowing ? <PersonAddIcon /> : <PersonRemoveIcon />}
      onClick={handleButtonClick}
    >
      {!isFollowing ? "Follow" : "Unfollow"}
    </Button>
  );
};

export default FollowButton;
