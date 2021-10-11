import React from "react";
import { useHistory } from "react-router";
import "../styles/main.css";
import mobileGUI from "../images/mobile-gui.PNG";
import noTurnImage from "../images/phone-orientation-noTurn.PNG";
import leftTurnImage from "../images/phone-orientation-leftTurn.PNG";
import rightTurnImage from "../images/phone-orientation-rightTurn.PNG";

interface IHowToPlayProps {}

const HowToPlayPage = (props: IHowToPlayProps) => {
  const history = useHistory();
  return (
    <div className="container">
      <h2 className="center">How to play</h2>
      <h3 className="center">Connecting to a game</h3>
      <p>
        On the front page, write a room name. This name is used to connect your
        phone and computer.
        <i>
          In the future this will be generated for you and possibly a QR code to
          scan from your phone.
        </i>
      </p>

      <hr />
      <h3 className="center">Steering with your phone</h3>
      <p>First you need to lock your phone in portrait mode.</p>

      <h4>The controller</h4>
      <img src={mobileGUI} className="info-image" alt="" />
      <p>
        The controller looks like the image above. Press the 'forward' button to
        go forward.
      </p>

      <h4>Steering</h4>

      <img src={noTurnImage} className="info-image-small" alt="" />
      <p>To begin with align your phone like the image above.</p>
      <img src={leftTurnImage} className="info-image-small" alt="" />
      <p>
        To turn left tilt your phone like in the image. This is to emulate a
        steering wheel in a car.
      </p>
      <img src={rightTurnImage} className="info-image-small" alt="" />
      <p>To turn right tilt your phone like in the image above.</p>

      <hr />
      <button onClick={() => history.goBack()}>
        Go back to room selection
      </button>
    </div>
  );
};

export default HowToPlayPage;
