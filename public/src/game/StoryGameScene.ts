import { IVehicle } from "../vehicles/IVehicle";
import { GameScene } from "./GameScene";


export class StoryGameScene extends GameScene {


    // only one vehicle
    vehicle: IVehicle;

    constructor() {
        super()


    }


    update(time: number) {

        this.updatePing()
        this.updateFps(time)



    }
}