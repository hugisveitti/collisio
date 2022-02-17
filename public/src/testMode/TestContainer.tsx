import React, { useEffect } from "react";
import GameRoom from "../components/gameRoom/GameRoom";
// import GameRoom from "../components/GameRoom";
import { IStore } from "../components/store";
import ControlsRoom from "../mobile/ControlsRoom";
import { fakePlayer1 } from "../tests/fakeData";
import { getSocket } from "../utils/connectSocket";

interface ITestContainer {
  store: IStore;
  onMobile: boolean;
}

const TestContainer = (props: ITestContainer) => {
  useEffect(() => {
    props.store.setPlayer(fakePlayer1);
  }, []);

  const socket = getSocket();

  if (props.onMobile && !props.store.player)
    return <span>Loading on mobile test setup...</span>;
  if (!socket) return <span>Loading test setup...</span>;

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
