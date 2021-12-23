import React from "react";
import GameRoom from "../components/gameRoom/GameRoom";
// import GameRoom from "../components/GameRoom";
import { IStore } from "../components/store";
import ControlsRoom from "../mobile/ControlsRoom";

interface ITestContainer {
  store: IStore;
  onMobile: boolean;
}

const TestContainer = (props: ITestContainer) => {
  if (props.onMobile && !props.store.player)
    return <span>Loading test setup...</span>;
  if (!props.store.socket) return <span>Loading test setup...</span>;

  // if (!onMobile && !canStartGame)
  //   return <span>Loading test setup desktop...</span>;

  return (
    <React.Fragment>
      {props.onMobile ? (
        <ControlsRoom store={props.store} />
      ) : (
        <GameRoom store={props.store} useTestCourse isTestMode />
      )}
    </React.Fragment>
  );
};

export default TestContainer;
