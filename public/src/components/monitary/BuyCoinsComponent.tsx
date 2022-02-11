import { CardActions, CardContent, Grid, Typography } from "@mui/material";
import React, { useContext } from "react";
import { toast } from "react-toastify";
import { UserContext } from "../../providers/UserProvider";
import { getSizePrefix } from "../../utils/utilFunctions";
import BackdropContainer from "../backdrop/BackdropContainer";
import BackdropButton from "../button/BackdropButton";
import MyCard from "../card/MyCard";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import { IStore } from "../store";
import TokenComponent from "../tokenComponent/TokenComponent";
import { buyOptions } from "./buyCoinsOptions";

interface IBuyCoinsComponent {
  store: IStore;
}

const BuyCoinsComponent = (props: IBuyCoinsComponent) => {
  const user = useContext(UserContext);

  return (
    <BackdropContainer>
      <Grid container spacing={3}>
        <Grid item xs={12} md={1}>
          <ToFrontPageButton />
        </Grid>
        <Grid item xs={12} md={5}>
          <div className="background">
            <Typography>
              Buy coins and spend them on tracks, vehicles and items to
              customize your vehicles!
            </Typography>
          </div>
        </Grid>
        <Grid item xs={12} md={6}>
          <TokenComponent store={props.store} user={user} />
        </Grid>
        {buyOptions.map((option) => {
          return (
            <Grid key={`buy-${option.euros}`} item xs={12} md={6} lg={4} xl={3}>
              <MyCard>
                <CardContent>
                  <Typography>
                    Cost in euros <strong>€{option.euros}</strong>
                  </Typography>
                  <Typography>Coins recieved {option.coins}</Typography>
                </CardContent>
                <CardActions>
                  <BackdropButton
                    onClick={() => {
                      console.log("buy coins not implemented");
                      toast.warn("Not implemented");
                    }}
                  >
                    Buy {getSizePrefix(option.coins)} coins
                  </BackdropButton>
                </CardActions>
              </MyCard>
            </Grid>
          );
        })}
      </Grid>
    </BackdropContainer>
  );
};

export default BuyCoinsComponent;
