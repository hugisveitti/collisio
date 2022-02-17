import React from "react";
import { VehicleType } from "../../shared-backend/shared-stuff";
import {
  getStatsFromSetup,
  possibleVehicleItemTypes,
  possibleVehicleMods,
  VehicleSetup,
} from "../../shared-backend/vehicleItems";
import { vehicleConfigs } from "../../vehicles/VehicleConfigs";
import Progress from "../inputs/progress/Progress";

interface IVehicleStatsComponent {
  vehicleSetup: VehicleSetup;
  vehicleType: VehicleType;
}

const VehicleStatsComponent = (props: IVehicleStatsComponent) => {
  const stats = getStatsFromSetup(props.vehicleSetup);

  return (
    <div className="background" style={{ paddingBottom: 25 }}>
      {possibleVehicleMods.map((mod) => {
        const key = mod.type;
        const val = vehicleConfigs[props.vehicleType][key]; //+ (stats[mod.type] ?? 0);

        return (
          <div
            key={key}
            style={{
              height: 25,
              marginTop: 10,
              color: "white",
              marginBottom: 15,
            }}
          >
            <span>{mod.name}</span>
            <Progress
              style={{
                float: "right",
              }}
              max={mod.max - mod.min}
              value={val - mod.min}
              extraValue={stats[mod.type] ?? 0}
            />
          </div>
        );
      })}
    </div>
  );
};

export default VehicleStatsComponent;
