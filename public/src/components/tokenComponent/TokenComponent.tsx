import React, { useEffect, useState } from "react";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import StarsIcon from "@mui/icons-material/Stars";
import { IUser } from "../../classes/User";
import { getUserTokens } from "../../firebase/firestoreFunctions";
import { defaultTokenData } from "../../shared-backend/medalFuncions";

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

  return (
    <div className="background" style={{ fontSize: 32 }}>
      <MonetizationOnIcon /> <span>Coins</span> {tokenData.coins}
      <br />
      <StarsIcon /> <span>XP</span> {tokenData.XP}
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
