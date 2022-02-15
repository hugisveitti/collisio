import { CardContent, Grid, Typography } from "@mui/material";
import React, { useContext } from "react";
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

  const infoText = props.canceled
    ? "Payment canceled"
    : "Payment successfully completed!";

  return (
    <BackdropContainer>
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
          </MyCard>
        </Grid>
        <Grid item xs={12}>
          <BackdropButton link={garagePagePath}>Go to garage</BackdropButton>
        </Grid>
      </Grid>
    </BackdropContainer>
  );
};

export default PaymentCallbackContainer;
