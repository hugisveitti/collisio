import { CardContent, CircularProgress, Typography } from "@mui/material";
import React from "react";
import { getSizeAbbr } from "../../utils/utilFunctions";
import BackdropButton from "../button/BackdropButton";
import MyCard from "../card/MyCard";
import { buyCoinsPagePath } from "../Routes";

interface IBuyItemComponent {
  cost: number;
  label: React.ReactNode;
  onBuy: () => void;
  owned: boolean;
  loading?: boolean;
  buyButtonText?: string;
  onUnequip?: () => void;
  notAfford: boolean;
}

const BuyItemComponent = (props: IBuyItemComponent) => {
  const renderUnequipButton = () => {
    if (props.onUnequip) {
      return (
        <BackdropButton onClick={props.onUnequip}>
          Unequip {props.buyButtonText ?? "item"}
        </BackdropButton>
      );
    }
    return <Typography>Owned</Typography>;
  };

  const renderBuyButton = () => {
    if (props.notAfford) {
      return (
        <>
          <Typography>Cost {getSizeAbbr(props.cost)}</Typography>
          <Typography>You don't have enough coins</Typography>
          <BackdropButton link={buyCoinsPagePath}>Buy coins</BackdropButton>
        </>
      );
    }

    return (
      <>
        <Typography>Cost {getSizeAbbr(props.cost)}</Typography>
        <BackdropButton onClick={props.onBuy}>
          Buy {props.buyButtonText ?? "item"}
        </BackdropButton>
      </>
    );
  };

  return (
    <MyCard nonOpague>
      <CardContent>
        {props.loading ? (
          <CircularProgress />
        ) : (
          <>
            <div>{props.label}</div>
            {props.owned ? renderUnequipButton() : renderBuyButton()}
          </>
        )}
      </CardContent>
    </MyCard>
  );
};

export default BuyItemComponent;
