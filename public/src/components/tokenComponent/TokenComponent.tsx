import React, { useEffect, useState } from "react";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import StarsIcon from "@mui/icons-material/Stars";
import { IUser } from "../../classes/User";
import { getUserTokens } from "../../firebase/firestoreFunctions";
import { defaultTokenData } from "../../shared-backend/medalFuncions";
import { getSizePrefix, getXPInfo } from "../../utils/utilFunctions";
import Progress from "../inputs/progress/Progress";
import { IStore } from "../store";
import CircularProgress from "@mui/material/CircularProgress";
import { getDeviceType } from "../../utils/settings";

interface ITokenComponent {
  user: IUser;
  showInfo?: boolean;
  store: IStore;
}

const TokenComponent = (props: ITokenComponent) => {
  const onMobile = getDeviceType() === "mobile";
  useEffect(() => {
    if (props.user?.uid && !props.store.tokenData) {
      getUserTokens(props.user.uid)
        .then((data) => {
          console.log("got token data", data);
          props.store.setTokenData(data);
        })
        .catch(() => {
          props.store.setTokenData(defaultTokenData);
        });
    }
  }, [props.user]);

  if (!props.user) return null;

  if (!props.store.tokenData) {
    return (
      <div className="background">
        <CircularProgress />
      </div>
    );
  }

  let coinsString = getSizePrefix(props.store.tokenData.coins);

  const {
    currentLevel,
    pointsToNextLevel,
    ratioOfLevelFinished,
    pointsFinishedInThisLevel,
  } = getXPInfo(props.store.tokenData.XP);

  return (
    <div className="background" style={{ fontSize: 32, color: "white" }}>
      <MonetizationOnIcon /> <span style={{ fontSize: 24 }}>Coins</span>{" "}
      {coinsString}
      <br />
      <StarsIcon /> <span style={{ fontSize: 24, marginRight: 10 }}>Level</span>
      {currentLevel}
      <span style={{ fontSize: 16, marginRight: 5, marginLeft: 10 }}>
        {pointsFinishedInThisLevel.toFixed(0)} /{" "}
        {pointsFinishedInThisLevel + pointsToNextLevel}
      </span>
      <Progress value={ratioOfLevelFinished} max={1} />
      {props.showInfo && !onMobile && (
        <>
          <br />
          <span>
            Finish races to earn XP and coins, spend coins in the Garage and buy
            Tracks!
          </span>
        </>
      )}
    </div>
  );
};

export default TokenComponent;
