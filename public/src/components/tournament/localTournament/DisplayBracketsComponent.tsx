import Typography from "@mui/material/Typography";
import React, { useEffect } from "react";
import { BracketTree } from "../../../classes/Tournament";
import { green1, red1, red2, red4 } from "../../../providers/theme";

interface IDisplayBracketsComponent {
  bracket: BracketTree;
}

const DisplayBracketsComponent = (props: IDisplayBracketsComponent) => {
  const slotH = 60;

  // const [containerHeight, setContainerHeight] = useState()
  const treeHeight = props.bracket?.getTreeHeight
    ? props.bracket.getTreeHeight()
    : 1;
  const height = props.bracket?.getTreeHeight
    ? 2 ** props.bracket?.getTreeHeight() * (slotH + 10)
    : 100;

  const slotW = 150;
  const leftOff = 75;

  const createSlotsDiv = (node: BracketTree, top: number, right: number) => {
    const slotStyle = { height: 30 };
    if (node.child1) {
    }

    const topOff = (2 ** (treeHeight - node.height) * slotH) / 2;
    return (
      <>
        <div
          style={{
            backgroundColor: red4,
            width: slotW,
            position: "absolute",
            top,
            right,
            padding: 5,
            color: "white",
            boxShadow: `5px 5px ${red2}`,
          }}
        >
          <div style={{ ...slotStyle }}>
            <span>{node.player1?.displayName}</span>
            <span style={{ float: "right" }}>{node.player1Score}</span>
          </div>
          <hr />
          <div style={{ ...slotStyle }}>
            <span>{node.player2?.displayName}</span>
            <span style={{ float: "right" }}>{node.player2Score}</span>
          </div>
        </div>

        {node.child1 &&
          createSlotsDiv(node.child1, top - topOff, right + slotW + leftOff)}
        {node.child2 &&
          createSlotsDiv(node.child2, top + topOff, right + slotW + leftOff)}
      </>
    );
  };

  return (
    <div style={{ margin: "auto" }}>
      <div
        style={{
          position: "relative",
          height: height + slotH,
          marginBottom: 20,
          backgroundColor: green1,
          width: (slotW + leftOff) * treeHeight,
          overflowX: "auto",
        }}
      >
        {createSlotsDiv(props.bracket, height / 2, slotW / 4)}
      </div>
    </div>
  );
};

export default DisplayBracketsComponent;
