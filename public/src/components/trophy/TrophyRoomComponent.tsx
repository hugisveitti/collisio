import Grid from "@mui/material/Grid";
import React, { useEffect, useRef, useState } from "react";
import { TrackName } from "../../shared-backend/shared-stuff";
import {
  createTrophyRoomCanvas,
  removeTrophyRoomCanvas,
} from "./trophyRoomCanvas";

interface ITrophyRoomComponent {
  id: string;
}

interface ITrophyData {
  owner?: string;
  tournamentId?: string;
  tournamentName?: string;
  originalValue: number;
  trophyId: number;
  trophyName: string;
}

const trophyDatabase: { [id: string]: ITrophyData } = {
  0: {
    originalValue: 1,
    trophyId: 1,
    trophyName: "First",
  },
  1: {
    owner: "some id",
    tournamentId: "test id",
    tournamentName: "test name",
    originalValue: 1,
    trophyId: 1,
    trophyName: "Snake",
  },
  2: {
    originalValue: 1,
    trophyId: 1,
    trophyName: "Picky",
  },
};

const TrophyRoomComponent = (props: ITrophyRoomComponent) => {
  const canvasWrapperRef = useRef();

  const [trophyData, setTrophyData] = useState({} as ITrophyData);

  useEffect(() => {
    createTrophyRoomCanvas(props.id)
      .then((renderer) => {
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
        if (props.id in trophyDatabase) {
          setTrophyData(trophyDatabase[props.id]);
        }
      })
      .catch((err) => {
        console.warn("error creating trophy room canvas:", err);
      });

    return () => {
      removeTrophyRoomCanvas();
    };
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <div ref={canvasWrapperRef}></div>
      </Grid>
      <Grid item xs={12}>
        {trophyData.trophyName}
      </Grid>
      <Grid item xs={12}>
        Original value {trophyData.originalValue}
      </Grid>
      {!trophyData.owner ? (
        <Grid item xs={12}>
          Unclaimed
        </Grid>
      ) : (
        <>
          <Grid item xs={12}>
            Owner: {trophyData.owner}
          </Grid>
          <Grid item xs={12}>
            Won in tournament: {trophyData.tournamentName}
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default TrophyRoomComponent;
