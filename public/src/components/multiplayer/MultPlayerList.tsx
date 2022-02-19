import { Divider, Typography } from "@mui/material";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import React from "react";
import { getStyledColors } from "../../providers/theme";
import { IPlayerInfo } from "../../shared-backend/shared-stuff";
import { getVehicleNameFromType } from "../../vehicles/VehicleConfigs";

interface IMultPlayerList {
  players: IPlayerInfo[];
  userId: string;
}

const MultPlayerList = (props: IMultPlayerList) => {
  if (props.players.length === 0) {
    return <Typography>No players connected</Typography>;
  }

  const { color, backgroundColor } = getStyledColors("white");

  return (
    <List style={{ color, backgroundColor }}>
      {props.players.map((p, i) => {
        return (
          <React.Fragment key={p.id}>
            <ListItem>
              {props.userId === p.id ? (
                <strong>{p.playerName}</strong>
              ) : (
                <span>{p.playerName}</span>
              )}
              <span style={{ marginLeft: 10, fontSize: 10 }}>
                {getVehicleNameFromType(p.vehicleType)}
              </span>
              {p.isLeader && <i style={{ marginLeft: 12 }}> Leader</i>}
            </ListItem>
            {i !== props.players.length - 1 && (
              <ListItem>
                <Divider style={{ color }} />
              </ListItem>
            )}
          </React.Fragment>
        );
      })}
    </List>
  );
};

export default MultPlayerList;
