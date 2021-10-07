import { useHistory } from "react-router";
import { Socket } from "socket.io-client";
import { initGryoscope } from "../mobile/mobileController";
import { frontPagePath } from "./Routes";
import { IStore } from "./store";

interface IControlsRoomProps {
  socket: Socket;
  store: IStore;
}

const ControlsRoom = (props: IControlsRoomProps) => {
  const history = useHistory();
  if (!props.store.roomName) {
    history.push(frontPagePath);
    return null;
  }

  if (!props.store.roomName) {
    // breaks the webpage on iphone
    // window.location.href = frontPagePath;
  }
  initGryoscope(props.socket);
  return null;
};

export default ControlsRoom;
