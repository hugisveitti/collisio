import { CardContent, CircularProgress, Typography } from "@mui/material";
import React from "react";
import { getSizePrefix } from "../../utils/utilFunctions";
import BackdropButton from "../button/BackdropButton";
import MyCard from "../card/MyCard";

interface IBuyItemComponent {
  cost: number;
  label: React.ReactNode;
  onBuy: () => void;
  owned: boolean;
  loading?: boolean;
  buyButtonText?: string;
  onUnequip?: () => void;
}

const BuyItemComponent = (props: IBuyItemComponent) => {
  console.log("Loading", props.loading);

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

  return (
    <MyCard>
      <CardContent>
        {props.loading ? (
          <CircularProgress />
        ) : (
          <>
            <div>{props.label}</div>
            {props.owned ? (
              renderUnequipButton()
            ) : (
              <>
                <Typography>Cost {getSizePrefix(props.cost)}</Typography>
                <BackdropButton onClick={props.onBuy}>
                  Buy {props.buyButtonText ?? "item"}
                </BackdropButton>
              </>
            )}
          </>
        )}
      </CardContent>
    </MyCard>
  );
};

export default BuyItemComponent;
