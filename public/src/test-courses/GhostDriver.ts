import { Quaternion, Vector3 } from "three";
import { downloadGhost, getTournamentGhost, uploadGhost, uploadTournamentGhost } from "../firebase/firebaseStorageFunctions";
import { TrackName, VehicleType } from "../shared-backend/shared-stuff";
import { IGhostVehicle } from "../vehicles/GhostVehicle";
import { IVehicle } from "../vehicles/IVehicle";
import { isVehicleType } from "../vehicles/VehicleConfigs";

export class GhostDriver {


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
    async loadDriveInstructions(filename: string, isTournament: boolean): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            if (isTournament) {
                await this.loadTournamentInstructions(filename)
                resolve()
            } else {
                downloadGhost(filename).then((instructions) => {
                    this.isReady = true
                    if (instructions?.length) {
                        this.di = instructions
                        this.hasInstructions = true
                    } else {
                        this.hasInstructions = false
                    }
                    resolve()
                }).catch(err => {
                    console.warn("Error getting ghost:", err)
                    reject()
                })
            }
        })
    }

    async loadTournamentInstructions(tournamentId: string) {
        return new Promise<void>((resolve, reject) => {
            getTournamentGhost(tournamentId).then(instructions => {
                this.isReady = true
                if (instructions?.length) {
                    this.di = instructions
                    this.hasInstructions = true
                } else {
                    this.hasInstructions = false
                }
                resolve()
            }).catch(err => {
                console.warn("Error getting tournament ghost, err:", err)
                reject()
            })
        })
    }

    getVehicleType(): VehicleType | undefined {
        if (!this.di || this.di.length < 1) {
            return undefined
        }
        const str = this.di[0].split(" ")[0]
        if (isVehicleType(str)) {
            this.vehicleType = str as VehicleType
            return str as VehicleType
        }

        return undefined
    }

    reset() {
        this.pos = new Vector3(0, 0, 0)
        this.rotation = new Quaternion(0, 0, 0, 0)
        this.nextPos = new Vector3(0, 0, 0)
        this.nextRotation = new Quaternion(0, 0, 0, 0)
        this.betweenPos = new Vector3(0, 0, 0)
        this.betweenRot = new Quaternion(0, 0, 0, 0)
        this.isReady = true
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
        if (!this.nextPointSet && this.timeIndex < this.di.length) {
            this.setPositionRotationFromInstruction(this.di[this.timeIndex], this.nextPos, this.nextRotation)
            console.log("next pos", this.nextPos.x.toFixed(2), this.nextPos.z.toFixed(2))

            this.nextPointSet = true
        }

        const alpha = this.numNotUpdates / (60 / (epsTime * 100))
        console.log("alpha", alpha)
        if (alpha < 1) {
            this.betweenPos = this.pos.clone().lerp(this.nextPos, alpha)
            console.log("betweenpos", this.betweenPos.x.toFixed(2), this.betweenPos.z.toFixed(2))
            this.betweenRot = this.rotation.clone().slerp(this.nextRotation, alpha)

        }
    }

    setToStart(vehicle: IGhostVehicle) {

        if (!this.hasInstructions || this.di.length < 2) {
            console.warn("Can't set ghost vehicle to start, since have not got instructions")
            return
        }

        this.setPositionRotationFromInstruction(this.di[1], this.pos, this.rotation)
        vehicle.setPosition(this.pos.clone())
        vehicle.setRotation(this.rotation.clone())
    }

    setPlace(vehicle: IGhostVehicle, time: number, delta: number) {
        if (!this.hasInstructions) return
        const cTime = this.getTime(this.timeIndex)
        if (this.timeIndex < this.di.length - 1 && cTime < time) {
            this.setPositionRotationFromInstruction(this.di[this.timeIndex], this.pos, this.rotation)
            vehicle.setPosition(this.pos.clone())
            vehicle.setRotation(this.rotation.clone())
            this.numNotUpdates = 0
            this.nextPointSet = false

            this.timeIndex += 1
        } else if (cTime > time) {
            this.numNotUpdates += 1
            // this.getPointBetween()
            // vehicle.setPosition(this.betweenPos.clone())
            // vehicle.setRotation(this.betweenRot.clone())
        } else {
            console.log("no update")
            // this.numNotUpdates += .5
            // this.getPointBetween()
            // vehicle.setPosition(this.betweenPos.clone())
            // vehicle.setRotation(this.betweenRot.clone())
        }
    }
}

// how often save should occure
let epsTime = .15

interface DriveRecorderConfig {
    active: boolean
    trackName: TrackName
    numberOfLaps: number
    vehicleType: VehicleType
    tournamentId: string | undefined
    playerId: string
    playerName: string
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
        return `${time.toFixed(2)} ${p.x.toFixed(1)} ${p.y.toFixed(1)} ${p.z.toFixed(1)} ${r.x.toFixed(2)} ${r.y.toFixed(2)} ${r.z.toFixed(2)} ${r.w.toFixed(2)}`
    }

    goalCrossed() {
        if (!this.config.active) return
        this.finishedLaps += 1
        if (this.config.numberOfLaps === this.finishedLaps) {
            if (this.config.tournamentId) {
                //     this.saveTournamentRecording()
            }
        }
    }

    getMetadata() {
        return `${this.config.vehicleType} ${this.config.numberOfLaps} ${this.config.trackName} ${this.config.tournamentId ?? "no-tournament"} ${this.config.playerName} ${this.config.playerId}`
    }

    saveTournamentRecording = (totalTime: number, playerName?: string, playerId?: string) => {
        const metaData = [this.getMetadata()]
        uploadTournamentGhost(this.config.tournamentId, metaData.concat(this.instructions), totalTime)
    }

    getRecordingFilename() {
        return `${this.config.playerId}/${this.config.trackName}/${this.config.numberOfLaps}`
    }

    static GetTrackNameNumberOfLapsFromFilename(filename: string): { trackName: TrackName, numberOfLaps: number } {
        if (!filename) return { trackName: undefined, numberOfLaps: undefined }

        const items = filename.split("/")
        // if tournament ghost
        if (items.length < 3) {
            return { trackName: undefined, numberOfLaps: undefined }
        }
        return { trackName: items[1] as TrackName, numberOfLaps: +items[2] }

    }

    /**
     * Might need to save through player and set some firestore rules
     */
    saveRecordedInstructions = () => {
        const metaData = [this.getMetadata()]
        const filename = this.getRecordingFilename()
        uploadGhost(filename, metaData.concat(this.instructions))
    }
}