import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import React from "react";
import { ITournament } from "../../classes/Tournament";
import { inputBackgroundColor } from "../../providers/theme";
import { VehicleType } from "../../shared-backend/shared-stuff";

interface ITournamentSelect {
  tournaments: ITournament[];
  onChange: (tournamentId: string) => void;
  selectedId: string | undefined;
}

const TournamentSelect = (props: ITournamentSelect) => {
  const tournamentOptions: any[] = props.tournaments.concat([
    {
      name: "No tournament",
      id: "undefined",
    } as ITournament,
  ]);

  return (
    <FormControl style={{ minWidth: 150 }}>
      <InputLabel id="tournament-select">Tournament</InputLabel>
      <Select
        style={{
          backgroundColor: inputBackgroundColor,
        }}
        label="Tournament"
        name="tournament"
        onChange={(e) => {
          props.onChange(e.target.value);
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
  );
};

export default TournamentSelect;
