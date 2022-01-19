import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import React from "react";
import { ITournament } from "../../classes/Tournament";
import { getStyledColors, inputBackgroundColor } from "../../providers/theme";
import { VehicleType } from "../../shared-backend/shared-stuff";
import { itemInArray } from "../../utils/utilFunctions";
import "./select.css";

interface ITournamentSelect {
  tournaments: ITournament[] | undefined;
  onChange: (tournament: ITournament | undefined) => void;
  selectedId: string | undefined;
  selectedName: string | undefined;
}

const TournamentSelect = (props: ITournamentSelect) => {
  if (!props.tournaments) {
    return <CircularProgress />;
  }

  const { color, backgroundColor } = getStyledColors("white");

  const tournamentOptions: any[] = props.tournaments.concat([
    {
      name: "No tournament",
      id: "undefined",
    } as ITournament,
  ]);

  // if id is set on other device
  if (
    props.selectedId &&
    !itemInArray(
      props.selectedId,
      tournamentOptions.map((t) => t.id)
    )
  ) {
    tournamentOptions.push({
      name: props.selectedName ?? "Selected tournament",
      id: props.selectedId,
    });
  }

  return (
    <React.Fragment>
      <span
        className="select__label"
        style={{ color: backgroundColor, marginTop: 15 }}
      >
        Tournament
      </span>
      <FormControl style={{ minWidth: 150 }}>
        <Select
          style={{
            backgroundColor,
            color,
          }}
          className="select"
          name="tournament"
          onChange={(e) => {
            const tourId = e.target.value as string;
            const tournament = tournamentOptions.find((t) => t.id === tourId);
            if (!tournament?.id || tournament?.id === "undefined") {
              props.onChange(undefined);
            } else {
              props.onChange(tournament);
            }
          }}
          value={props.selectedId ?? "undefined"}
        >
          {tournamentOptions.map((tournament) => (
            <MenuItem key={tournament.id ?? "undefined"} value={tournament.id}>
              {tournament.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </React.Fragment>
  );
};

export default TournamentSelect;
