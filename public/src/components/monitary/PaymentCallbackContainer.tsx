import { CardContent, Grid, Typography } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import {
  getLatestCoinTransaction,
  ICoinTransaction,
} from "../../firebase/firebaseBuyCoinsFunctions";
import { UserContext } from "../../providers/UserProvider";
import BackdropContainer from "../backdrop/BackdropContainer";
import BackdropButton from "../button/BackdropButton";
import MyCard from "../card/MyCard";
import ToFrontPageButton from "../inputs/ToFrontPageButton";
import { garagePagePath } from "../Routes";
import { IStore } from "../store";
import TokenComponent from "../tokenComponent/TokenComponent";

interface IPaymentCallbackContainer {
  canceled?: boolean;
  store: IStore;
}

const PaymentCallbackContainer = (props: IPaymentCallbackContainer) => {
  const user = useContext(UserContext);
  const [transaction, setTransaction] = useState(
    undefined as ICoinTransaction | undefined
  );

  const infoText = props.canceled
    ? "Payment canceled"
    : "Payment successfully completed!";

  useEffect(() => {
    if (user && !props.canceled) {
      getLatestCoinTransaction(user.uid).then((trans) => {
        setTransaction(trans);
      });
    }
  }, [user]);

  return (
    <BackdropContainer autoEnter>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ToFrontPageButton />
        </Grid>
        <Grid item xs={12}>
          <TokenComponent store={props.store} user={user} />
        </Grid>
        <Grid item xs={12}>
          <MyCard>
            <CardContent>
              <Typography>{infoText}</Typography>
            </CardContent>
            <CardContent>
              <Typography>
                If you think there has been an error, please contact
                hugiholm1[at]gmail.com
              </Typography>
            </CardContent>
          </MyCard>
        </Grid>
        {transaction && (
          <Grid item xs={12}>
            <MyCard>
              <CardContent>
                <Typography>Latest transaction</Typography>
                <Typography>
                  <i>{transaction.metadata?.productName}</i>
                </Typography>
                <Typography>
                  Coins bought <strong>{transaction.metadata?.coins}</strong>
                </Typography>
                <Typography>
                  For euros <strong>€{transaction.metadata?.euros}</strong>
                </Typography>
              </CardContent>
            </MyCard>
          </Grid>
        )}
        <Grid item xs={12}>
          <BackdropButton link={garagePagePath}>Go to garage</BackdropButton>
        </Grid>
      </Grid>
    </BackdropContainer>
  );
};

export default PaymentCallbackContainer;
