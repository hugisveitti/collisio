import { IGameScene } from "../game/IGameScene";
import { MyScene } from "../game/MyScene";
import { VehicleType } from "../shared-backend/shared-stuff";
import { ITestVehicle } from "./IVehicle";
import { SphereVehicle } from "./SphereVehicle";

export class SphereTestVehicle extends SphereVehicle implements ITestVehicle {
    constructor(scene: MyScene, color: string | number | undefined, name: string, vehicleNumber: number, vehicleType: VehicleType, useSoundEffects?: boolean) {
        super({ scene, name, vehicleNumber, vehicleType, useSoundEffects, id: "sphere test" })
    }

    randomDrive(): void {

    }

    intelligentDrive(log: boolean) {

    };
} 