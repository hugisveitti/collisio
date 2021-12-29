import { MobileControls, TrackName, VehicleType } from "../shared-backend/shared-stuff";
import { ITestVehicle, IVehicle } from "../vehicles/IVehicle";
import { setControllerFromInstruction } from "./testControls";


export class TestDriver {

    vehicle: ITestVehicle
    controller: MobileControls


    // not sure of the best way to store these
    // but I think a (key, value)
    // where key is time and value is 
    driveInstructions: { [key: number]: string }
    di: string[]
    timeIndex = 0

    constructor(vehicleType: VehicleType) {
        //    this.loadVechileConfig("f1VehicleConfig.json")
        //  this.loadDriveInstructions("recording_farm-track_1_f1.txt")
        this.controller = new MobileControls()
        this.di = []
    }


    async loadVechileConfig(filename: string) {
        fetch(`vehicleconfig/${filename}`).then(res => res.json()).then(data => {
        })
    }

    /**
     * load into memory drive instructions that is written in a file
     * likly a text file
     */
    async loadDriveInstructions(filename: string) {
        fetch(`driveinstructions/${filename}`).then(res => res.text()).then(val => {
            //    console.log("drive instructval", val)
            this.di = val.split("\n")
        })
    }

    getTime(i: number) {
        if (this.di.length === 0) return 1000
        return +this.di[i].split(" ")[0]
    }

    // this doesnt work very well
    setMobileController(time: number) {
        // let time = 
        //  console.log("length of di", this.di.length)
        if (this.timeIndex < this.di.length - 1) {
            setControllerFromInstruction(this.di[this.timeIndex], this.controller)
            this.timeIndex += 1
        } else {
            this.controller = new MobileControls()
        }

        return
        for (let i = 0; i < this.di.length - 1; i++) {

            if (this.getTime(i) < time && time < this.getTime(i + 1)) {
                setControllerFromInstruction(this.di[i], this.controller)
                this.di.splice(i, i - 1)
            }
        }
    }

}


export const saveRecordedInstructionsToServer = (recording: string[], trackName: TrackName, numberOfLaps: number, vehicleType: VehicleType) => {
    const data = { "instructions": recording.join("\n"), trackName, numberOfLaps, vehicleType }

    fetch("/saverecording", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(res =>
        res.text()
    ).then(val => {
        console.log("value,", val)
    })
}