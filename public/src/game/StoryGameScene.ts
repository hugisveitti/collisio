import { IVehicle } from "../vehicles/IVehicle";
import { GameScene } from "./GameScene";


export class StoryGameScene extends GameScene {


    // only one vehicle
    vehicle: IVehicle;

    constructor() {
        super()


    }


    _updateChild(time: number, delta: number) {
        this.updatePing()
        this.updateFps(time)
    }
}