import { Quaternion, Vector3 } from "three";
import { getTournamentGhost, uploadTournamentGhost } from "../firebase/firebaseStorageFunctions";
import { TrackName, VehicleType } from "../shared-backend/shared-stuff";
import { IGhostVehicle } from "../vehicles/GhostVehicle";
import { IVehicle } from "../vehicles/IVehicle";
import { isVehicleType } from "../vehicles/VehicleConfigs";

export class TestDriver {


    pos: Vector3
    rotation: Quaternion

    nextPos: Vector3
    nextRotation: Quaternion

    // not sure of the best way to store these
    // but I think a (key, value)
    // where key is time and value is 
    driveInstructions: { [key: number]: string }
    di: string[]
    // first line is metadata
    timeIndex = 1
    filename: string
    numNotUpdates = 0
    nextPointSet: boolean = false
    betweenPos: Vector3
    betweenRot: Quaternion
    isReady: boolean
    hasInstructions: boolean
    vehicleType: VehicleType | undefined

    constructor(trackName: TrackName, numberOfLaps: number, vehicleType?: VehicleType) {
        this.filename = `recording_${trackName}_${numberOfLaps}_${vehicleType}.txt`
        // this.loadVechileConfig("f1VehicleConfig.json")
        // this.loadDriveInstructions(this.filename)
        this.di = []
        this.pos = new Vector3(0, 0, 0)
        this.rotation = new Quaternion(0, 0, 0, 0)
        this.nextPos = new Vector3(0, 0, 0)
        this.nextRotation = new Quaternion(0, 0, 0, 0)
        this.betweenPos = new Vector3(0, 0, 0)
        this.betweenRot = new Quaternion(0, 0, 0, 0)
        this.isReady = false
        this.hasInstructions = false
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
        }).catch((err) => {
            console.warn("Error loading file:", this.filename, err)
        })
    }

    async loadTournamentInstructions(tournamentId: string) {
        return new Promise<void>((resolve, reject) => {

            getTournamentGhost(tournamentId).then(instructions => {
                this.isReady = true
                console.log("instructions", instructions)
                if (instructions?.length) {
                    this.di = instructions
                    this.hasInstructions = true
                } else {
                    this.hasInstructions = false
                }
                resolve()
            }).catch(err => {
                console.warn("err:", err)
                reject()
            })
        })
    }

    getVehicleType(): VehicleType | undefined {
        console.log("getting vehicletype, this.di", this.di)
        if (!this.di || this.di.length < 1) {
            return undefined
        }
        const str = this.di[0].split(" ")[0]
        console.log("str", str)
        if (isVehicleType(str)) {
            this.vehicleType = str as VehicleType
            return str as VehicleType
        }

        return undefined
    }

    reset() {
        console.log("resetting test driver", this)
        this.timeIndex = 1
    }

    getTime(i: number) {
        if (this.di.length === 0) return 1000
        return +this.di[i].split(" ")[0]
    }

    setPositionRotationFromInstruction(item: string, pos: Vector3, rotation: Quaternion) {
        const values = item.split(" ")
        pos.set(+values[1], + values[2], +values[3])
        rotation.set(+values[4], +values[5], +values[6], +values[7])
    }

    getPointBetween() {
        if (!this.nextPointSet && this.timeIndex + 1 < this.di.length) {
            this.setPositionRotationFromInstruction(this.di[this.timeIndex + 1], this.nextPos, this.nextRotation)
            this.nextPointSet = true
        }

        const alpha = this.numNotUpdates / (60 * epsTime)
        if (alpha < 1) {

            this.betweenPos = this.pos.clone().lerp(this.nextPos, alpha)
            this.betweenRot = this.rotation.clone().slerp(this.nextRotation, alpha)

        }
    }

    setPlace(vehicle: IGhostVehicle, time: number, delta: number) {
        if (!this.hasInstructions) return
        const cTime = this.getTime(this.timeIndex)
        if (this.timeIndex < this.di.length - 1 && cTime < time) {
            this.timeIndex += 1
            this.setPositionRotationFromInstruction(this.di[this.timeIndex], this.pos, this.rotation)
            // console.log("set pos", this.pos.x.toFixed(1), this.pos.z.toFixed(2))
            vehicle.setPosition(this.pos.clone())
            vehicle.setRotation(this.rotation.clone())
            this.numNotUpdates = 0
            this.nextPointSet = false
        } else if (cTime > time) {
            this.numNotUpdates += 1
            this.getPointBetween()
            //   console.log("set pos between", this.betweenPos.x.toFixed(1), this.betweenPos.z.toFixed(2))
            vehicle.setPosition(this.betweenPos.clone())
            vehicle.setRotation(this.betweenRot.clone())
        }
    }
}

// how often save should occure
let epsTime = .1

interface DriveRecorderConfig {
    active: boolean
    trackName: TrackName
    numberOfLaps: number
    vehicleType: VehicleType
    tournamentId: string
}

export class DriveRecorder {
    instructions: string[]

    prevTime: number
    config: DriveRecorderConfig
    finishedLaps = 0

    constructor(config: DriveRecorderConfig) {
        this.config = config
        this.instructions = []
        this.prevTime = -1
    }

    record(vehicle: IVehicle, time: number) {
        if (!this.config.active) return
        if (time - this.prevTime > epsTime) {

            this.instructions.push(
                this.getDriveInstruction(time, vehicle)
            )
            this.prevTime = time
        }
    }

    reset() {
        this.finishedLaps = 0
    }

    getDriveInstruction = (time: number, vehicle: IVehicle) => {
        const p = vehicle.getPosition()
        const r = vehicle.getRotation()
        return `${time.toFixed(2)} ${p.x.toFixed(1)} ${p.y.toFixed(1)} ${p.z.toFixed(1)} ${r.x.toFixed(3)} ${r.y.toFixed(3)} ${r.z.toFixed(2)} ${r.w.toFixed(2)}`
    }

    goalCrossed() {
        if (!this.config.active) return
        this.finishedLaps += 1
        console.log("goal crossed", this.config)
        console.log("fin laps", this.finishedLaps)
        if (this.config.numberOfLaps === this.finishedLaps) {
            console.log("saving lap")
            if (this.config.tournamentId) {
                this.saveRecordedInstructionsToServer()
            }
        }
    }

    saveTournamentRecording = (totalTime: number, playerName?: string, playerId?: string) => {
        const metaData = [`${this.config.vehicleType} ${this.config.numberOfLaps} ${this.config.trackName} ${this.config.tournamentId} ${playerName} ${playerId}`]
        console.log("meta data", metaData)
        uploadTournamentGhost(this.config.tournamentId, metaData.concat(this.instructions), totalTime)


    }

    saveRecordedInstructionsToServer = (playerName?: string, playerId?: string) => {
        const metaData = [`${this.config.vehicleType} ${this.config.numberOfLaps} ${this.config.trackName} ${this.config.tournamentId} ${playerName} ${playerId}`]
        console.log("meta data", metaData)
        //  uploadTournamentGhost(this.config.tournamentId, metaData.concat(this.instructions))


        //     const data = {
        //         "instructions": this.instructions.join("\n"), trackName: this.config.trackName, numberOfLaps: this.config.numberOfLaps, vehicleType: this.config.vehicleType
        //     }

        //     fetch("/saverecording", {
        //         method: "POST",
        //         headers: {
        //             'Content-Type': 'application/json'
        //         },
        //         body: JSON.stringify(data)
        //     }).then(res =>
        //         res.text()
        //     ).then(val => {
        //         console.log("value,", val)
        //     })
        // }
    }
}