import React, { useEffect, useState } from "react";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import StarsIcon from "@mui/icons-material/Stars";
import { IUser } from "../../classes/User";
import { getUserTokens } from "../../firebase/firestoreFunctions";
import { defaultTokenData } from "../../shared-backend/medalFuncions";
import { getSizePrefix, getXPInfo } from "../../utils/utilFunctions";
import Progress from "../inputs/progress/Progress";

interface ITokenComponent {
  user: IUser;
  showInfo?: boolean;
}

const TokenComponent = (props: ITokenComponent) => {
  const [tokenData, setTokenData] = useState(defaultTokenData);

  useEffect(() => {
    if (props.user?.uid) {
      getUserTokens(props.user.uid).then((data) => {
        console.log("got token data", data);
        setTokenData(data);
      });
    }
  }, [props.user]);

  if (!props.user) return null;

  let coinsString = getSizePrefix(tokenData.coins);

  const {
    currentLevel,
    pointsToNextLevel,
    ratioOfLevelFinished,
    pointsFinishedInThisLevel,
  } = getXPInfo(tokenData.XP);

  return (
    <div className="background" style={{ fontSize: 32 }}>
      <MonetizationOnIcon /> <span style={{ fontSize: 24 }}>Coins</span>{" "}
      {coinsString}
      <br />
      <StarsIcon /> <span style={{ fontSize: 24, marginRight: 10 }}>Level</span>
      {currentLevel}
      <span style={{ fontSize: 16, marginRight: 5, marginLeft: 10 }}>
        {pointsFinishedInThisLevel} /{" "}
        {pointsFinishedInThisLevel + pointsToNextLevel}
      </span>
      <Progress value={ratioOfLevelFinished} max={1} />
      {props.showInfo && (
        <>
          <br />
          <span>
            Finish races to earn XP and tokens, spend tokens in the Garage!
          </span>
        </>
      )}
    </div>
  );
};

export default TokenComponent;
