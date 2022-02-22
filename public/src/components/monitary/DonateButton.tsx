import React from "react";

// https://www.paypal.com/donate?hosted_button_id=Z7JL86S4UW456
export default () => {
  return (
    <div>
      <form action="https://www.paypal.com/donate" method="post" target="_top">
        <input type="hidden" name="hosted_button_id" value="Z7JL86S4UW456" />
        <input
          type="image"
          src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif"
          name="submit"
          title="PayPal - The safer, easier way to pay online!"
          alt="Donate with PayPal button"
        />
        <img
          alt=""
          src="https://www.paypal.com/en_IS/i/scr/pixel.gif"
          width="1"
          height="1"
        />
      </form>
      <br />
      <p>
        <a
          href="https://ko-fi.com/hugiholm"
          style={{ backgroundColor: "white", padding: 3 }}
        >
          Buy me a coffee.
        </a>
      </p>
    </div>
  );
};
