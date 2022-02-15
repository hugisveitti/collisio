import React from "react";
import { IBuyOption } from "../../firebase/firebaseBuyCoinsFunctions";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

interface ICheckoutComponent {
  product: IBuyOption | undefined;
}

const CheckoutComponent = (props: ICheckoutComponent) => {
  if (!props.product) {
    return null;
  }

  // return (
  //   <Elements>

  //   <div>
  //     <span>checkout</span>
  //   </div>
  //   </Elements>
  // );
};

export default CheckoutComponent;
