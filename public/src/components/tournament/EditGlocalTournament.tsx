import React from "react";
import { GlobalTournament } from "../../classes/Tournament";

interface IEditGlobalTournamentComponent {
  editTournament: GlobalTournament;
  updateTournament: (key: keyof GlobalTournament, value: any) => void;
}

const EditGlobalTournamentComponent = (
  props: IEditGlobalTournamentComponent
) => {
  return <React.Fragment>Nothing yet</React.Fragment>;
};

export default EditGlobalTournamentComponent;
