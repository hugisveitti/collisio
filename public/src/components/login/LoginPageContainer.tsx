import React from "react";
import { useHistory } from "react-router";
import BackdropContainer from "../backdrop/BackdropContainer";
import LoginComponent from "../LoginComponent";
import { frontPagePath } from "../Routes";

interface ILoginPageContainer {}

const LoginPageContainer = (props: ILoginPageContainer) => {
  const history = useHistory();
  return (
    <BackdropContainer backgroundContainer>
      <LoginComponent
        onClose={() => {
          history.push(frontPagePath);
        }}
      />
    </BackdropContainer>
  );
};

export default LoginPageContainer;
