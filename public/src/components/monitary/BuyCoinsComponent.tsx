import {
  CardActions,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  buyCoins,
  getCoinsBuyOptions,
  IBuyOption,
} from "../../firebase/firebaseBuyCoinsFunctions";

import { UserContext } from "../../providers/UserProvider";
import { getSizeAbbr } from "../../utils/utilFunctions";
import BackdropContainer from "../backdrop/BackdropContainer";
import BackdropButton from "../button/BackdropButton";
import MyCard from "../card/MyCard";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import { loginPagePath } from "../Routes";
import { IStore } from "../store";
import TokenComponent from "../tokenComponent/TokenComponent";

interface IBuyCoinsComponent {
  store: IStore;
}

const BuyCoinsComponent = (props: IBuyCoinsComponent) => {
  const user = useContext(UserContext);

  const [isBuying, setIsBuying] = useState(false);
  const [buyOptions, setBuyOptions] = useState(
    undefined as IBuyOption[] | undefined
  );

  useEffect(() => {
    getCoinsBuyOptions().then((options) => {
      setBuyOptions(options);
    });
  }, []);

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
        {user === undefined && (
          <Grid item xs={12}>
            <div className="background">
              <p>You need to be logged in to buy coins</p>
            </div>
            <BackdropButton link={loginPagePath}>
              Create a free account
            </BackdropButton>
          </Grid>
        )}
        {!buyOptions || isBuying ? (
          <>
            <Grid item xs={12}>
              <CircularProgress />
            </Grid>
            <Grid item xs={12}>
              <div className="background">
                <Typography>
                  {isBuying
                    ? "Loading checkout..."
                    : "Loading coin packages..."}
                </Typography>
              </div>
            </Grid>
          </>
        ) : (
          buyOptions.map((option) => {
            return (
              <Grid
                key={`buy-${option.euros}`}
                item
                xs={12}
                md={6}
                lg={4}
                xl={3}
              >
                <MyCard>
                  <CardContent>
                    <h3>{option.name}</h3>
                    <Typography>
                      Cost in euros <strong>???{option.euros}</strong>
                    </Typography>
                    <Typography>Coins recieved {option.coins}</Typography>
                  </CardContent>
                  <CardActions>
                    <BackdropButton
                      onClick={() => {
                        if (!user) {
                          toast.error("You need to be logged in to buy coins");
                          return;
                        }
                        setIsBuying(true);
                        buyCoins(user.uid, option.id)
                          .then(() => {
                            setIsBuying(false);
                          })
                          .catch((err) => {
                            setIsBuying(false);
                          });
                      }}
                    >
                      Buy {getSizeAbbr(option.coins)} coins
                    </BackdropButton>
                  </CardActions>
                </MyCard>
              </Grid>
            );
          })
        )}
      </Grid>
    </BackdropContainer>
  );
};

export default BuyCoinsComponent;
