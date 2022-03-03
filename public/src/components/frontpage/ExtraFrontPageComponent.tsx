import React from "react";
import { IUser } from "../../classes/User";
import { getDeviceType } from "../../utils/settings";
import BackdropButton from "../button/BackdropButton";
import {
  privateProfilePagePath,
  highscorePagePath,
  tournamentPagePath,
  howToPlayPagePath,
  aboutPagePath,
  multiplayerConnectPagePath,
  mobileOnlyWaitingRoomPath,
  singlePlayerWaitingRoomPath,
} from "../Routes";

interface IExtraFrontPageComponent {
  user: IUser;
  onBack: () => void;
}

const ExtraFrontPageComponent = (props: IExtraFrontPageComponent) => {
  const user = props.user;
  const onMobile = getDeviceType() === "mobile";
  const btnWidth = 180;
  return (
    <React.Fragment>
      <BackdropButton onClick={props.onBack}>&lt; Back</BackdropButton>
      <BackdropButton
        disabled={!user}
        link={privateProfilePagePath}
        width={btnWidth}
      >
        Settings
      </BackdropButton>
      <BackdropButton link={singlePlayerWaitingRoomPath} width={btnWidth}>
        Play with keyboard
      </BackdropButton>
      {onMobile && (
        <BackdropButton link={mobileOnlyWaitingRoomPath}>
          Play mobile version
        </BackdropButton>
      )}
      <BackdropButton link={highscorePagePath} width={btnWidth}>
        Highscores
      </BackdropButton>
      <BackdropButton link={tournamentPagePath} width={btnWidth}>
        Tournaments
      </BackdropButton>
      <BackdropButton link={howToPlayPagePath} width={btnWidth}>
        How to play
      </BackdropButton>
      <BackdropButton link={aboutPagePath} width={btnWidth}>
        About
      </BackdropButton>
    </React.Fragment>
  );
};

export default ExtraFrontPageComponent;
