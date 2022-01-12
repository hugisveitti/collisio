import { IGameScene } from "../game/IGameScene";
import { VehicleType } from "../shared-backend/shared-stuff";
import { ITestVehicle } from "./IVehicle";
import { SphereVehicle } from "./SphereVehicle";

export class SphereTestVehicle extends SphereVehicle implements ITestVehicle {
    constructor(scene: IGameScene, color: string | number | undefined, name: string, vehicleNumber: number, vehicleType: VehicleType, useSoundEffects?: boolean) {
        super({ scene, vehicleColor: color, name, vehicleNumber, vehicleType, useSoundEffects, })
    }

    randomDrive(): void {

    }

    intelligentDrive(log: boolean) {

    };
} 