import { CardContent, CircularProgress, Typography } from "@mui/material";
import React from "react";
import { getSizePrefix } from "../../utils/utilFunctions";
import BackdropButton from "../button/BackdropButton";
import MyCard from "../card/MyCard";

interface IBuyItemComponent {
  cost: number;
  label: string;
  onBuy: () => void;
  owned: boolean;
  loading?: boolean;
  buyButtonText?: string;
}

const BuyItemComponent = (props: IBuyItemComponent) => {
  return (
    <MyCard>
      <CardContent>
        {props.loading ? (
          <CircularProgress />
        ) : (
          <>
            <Typography>{props.label}</Typography>
            {props.owned ? (
              <Typography>Owned</Typography>
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
