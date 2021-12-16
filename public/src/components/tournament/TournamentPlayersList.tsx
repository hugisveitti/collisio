import {
  Avatar,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
} from "@mui/material";
import List from "@mui/material/List";
import React, { useEffect, useState } from "react";
import { ITournament, ITournamentUser } from "../../classes/Tournament";
import { IFollower, IUser } from "../../classes/User";
import {
  getPlayersInTournamentListener,
  updatePlayersInTournament,
} from "../../firebase/firestoreTournamentFunctions";
import { cardBackgroundColor, red1 } from "../../providers/theme";
import NumberSelect from "../inputs/NumberSelect";

interface IPlayerListItem {
  player: ITournamentUser;
  editingRanking: boolean;
  possibleRanks: number[];
  setPlayer: (player: ITournamentUser) => void;
  isLeader: boolean;
}

const PlayerListItem = (props: IPlayerListItem) => {
  const player = props.player;

  const [ranking, setRanking] = useState(player.ranking);

  const followingData: IFollower = {
    displayName: player.displayName,
    uid: player.uid,
    photoURL: player.photoURL,
  };

  return (
    <ListItem key={player.uid}>
      <ListItemAvatar>
        <Avatar src={player.photoURL} />
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography>
            {player.displayName} {props.isLeader && <i>Leader</i>}
          </Typography>
        }
        secondary={player.ranking}
      />
      {/* <ListItemButton>
        {props.user && (
          <FollowButton
            userData={userData}
            otherUserData={followingData}
            onlyIcon
          />
        )}
      </ListItemButton> */}
      {props.editingRanking && (
        <ListItemSecondaryAction>
          <NumberSelect
            title="Rank"
            minWidth={0}
            numbers={props.possibleRanks}
            value={ranking === -1 ? props.possibleRanks.length : ranking}
            style={{
              backgroundColor: ranking === -1 ? red1 : "inherit",
            }}
            onChange={(newRank) => {
              setRanking(newRank);
              const newPlayer = {
                ...props.player,
                ranking: newRank,
              };
              props.setPlayer(newPlayer);
            }}
          />
        </ListItemSecondaryAction>
      )}
    </ListItem>
  );
};

interface ITournamentPlayersList {
  user: IUser;
  tournament: ITournament;
  editingRanking: boolean;
  setPlayers: React.Dispatch<React.SetStateAction<ITournamentUser[]>>;
  players: ITournamentUser[];
}

const TournamentPlayersList = (props: ITournamentPlayersList) => {
  //const players = props.tournamentUsers;

  //  const [players, setPlayers] = useState([] as ITournamentUser[]);
  const [possibleRanks, setPossibleRanks] = useState([] as number[]);

  const userData: IFollower = {
    displayName: props.user?.displayName,
    uid: props.user?.uid,
    photoURL: props.user?.photoURL,
  };

  const sortPlayersByRank = (_players: ITournamentUser[]) => {
    let sortedPlayers = _players.sort((a, b) =>
      a.ranking > b.ranking ? 1 : -1
    );
    return sortedPlayers;
  };

  useEffect(() => {
    const unsub = getPlayersInTournamentListener(
      props.tournament.id,
      (_players) => {
        props.setPlayers(_players);
        const _possibleRanks = _players.map((val, i) => i + 1);
        setPossibleRanks(_possibleRanks);
      }
    );

    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    // sortPlayersByRank(players);

    if (!props.editingRanking) {
      updatePlayersInTournament(props.tournament.id, props.players);
    } else {
      const newPlayers: ITournamentUser[] = [];
      for (let p of props.players) {
        const newP = { ...p };
        if (p.ranking === -1) {
          newP.ranking = possibleRanks.length;
        }
        newPlayers.push(newP);
      }
      props.setPlayers(newPlayers);
    }
  }, [props.editingRanking]);

  const sortedPlayers = sortPlayersByRank(props.players);

  if (props.players.length === 0) {
    return <Typography>No players in tournament</Typography>;
  }
  return (
    <List
      style={{
        width: 500,
        maxWidth: "90%",
        margin: "auto",
        backgroundColor: cardBackgroundColor,
      }}
    >
      {sortedPlayers.map((player, i: number) => {
        return (
          <PlayerListItem
            key={player.uid}
            player={player}
            editingRanking={props.editingRanking}
            possibleRanks={possibleRanks}
            setPlayer={(newPlayer: ITournamentUser) => {
              const newPlayers = props.players;
              newPlayers[i] = newPlayer;
              props.setPlayers(newPlayers);
            }}
            isLeader={props.tournament.leaderId === player.uid}
          />
        );
      })}
    </List>
  );
};

export default TournamentPlayersList;
