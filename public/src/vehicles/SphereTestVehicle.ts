import { IGameScene } from "../game/IGameScene";
import { VehicleType } from "../shared-backend/shared-stuff";
import { ITestVehicle } from "./IVehicle";
import { SphereVehicle } from "./SphereVehicle";

export class SphereTestVehicle extends SphereVehicle implements ITestVehicle {
    constructor(scene: IGameScene, color: string | number | undefined, name: string, vehicleNumber: number, vehicleType: VehicleType, useEngineSound?: boolean) {
        super(scene, color, name, vehicleNumber, vehicleType, useEngineSound,)
    }

    randomDrive(): void {

    }

    intelligentDrive(log: boolean) {

    };
} 