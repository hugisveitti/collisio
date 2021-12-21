import React, { useEffect, useRef } from "react";
import {
  createTrophyRoomCanvas,
  removeTrophyRoomCanvas,
} from "./trophyRoomCanvas";

const TrophyRoomComponent = () => {
  const canvasWrapperRef = useRef();

  useEffect(() => {
    createTrophyRoomCanvas().then((renderer) => {
      if (canvasWrapperRef.current && renderer) {
        // @ts-ignore
        while (canvasWrapperRef.current.children.length > 0) {
          // @ts-ignore
          canvasWrapperRef.current.removeChild(
            // @ts-ignore
            canvasWrapperRef.current.children[0]
          );
        }

        renderer.domElement.setAttribute("style", "max-width:100%;");
        // @ts-ignore
        canvasWrapperRef.current.appendChild(renderer.domElement);
      }
    });

    return () => {
      console.log("component unmounted");
      removeTrophyRoomCanvas();
    };
  }, []);

  return <div ref={canvasWrapperRef}></div>;
};

export default TrophyRoomComponent;
