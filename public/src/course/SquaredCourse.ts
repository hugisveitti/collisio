import { ExtendedObject3D, Scene3D } from "enable3d";
import { Texture } from "three";
import { SimpleVector } from "../vehicles/IVehicle";


export class SimpleCourtSettings {

    team1Color: string | number
    team2Color: string | number
    goalWidth: number
    goalHeight: number
    goalDepth: number
    courtDepth: number
    courtWidth: number
    rampHeight: number
    rampHeightOffset: number
    rampAngle: number

    constructor() {
        this.team1Color = "red"
        this.team2Color = "blue"
        this.courtWidth = 100
        this.courtDepth = 400
        this.goalWidth = 25
        this.goalHeight = 10
        this.goalDepth = this.courtDepth / 2 - 15
        this.rampHeight = 20
        this.rampAngle = Math.PI / 2.5
        this.rampHeightOffset = Math.cos(this.rampAngle) * this.rampHeight / 2 - 1
    }
}


export class SimpleCourt {

    scene: Scene3D
    team1Color: string | number
    team2Color: string | number
    goalWidth: number
    goalHeight: number
    goalDepth: number
    courtDepth: number
    courtWidth: number
    rampHeight: number
    rampHeightOffset: number
    rampAngle: number

    constructor(scene: Scene3D,
        courtSettings: SimpleCourtSettings) {
        this.scene = scene
        this.team1Color = courtSettings.team1Color
        this.team2Color = courtSettings.team2Color
        this.goalWidth = courtSettings.goalWidth
        this.goalHeight = courtSettings.goalHeight
        this.goalDepth = courtSettings.goalDepth
        this.courtWidth = courtSettings.courtWidth
        this.courtDepth = courtSettings.courtDepth
        this.rampHeight = courtSettings.rampHeight
        this.rampHeightOffset = courtSettings.rampHeightOffset
        this.rampAngle = courtSettings.rampAngle
    }

    createGoals() {

        let goal1 = new ExtendedObject3D()
        const goal1Material = { lambert: { color: this.team1Color } }
        const goal2Material = { lambert: { color: this.team2Color } }

        goal1.add(this.scene.add.box({ x: this.goalWidth / 2, y: this.goalHeight / 2 - 2, z: 0, height: this.goalHeight }, goal1Material))
        goal1.add(this.scene.add.box({ x: -this.goalWidth / 2, y: this.goalHeight / 2 - 2, z: 0, height: this.goalHeight }, goal1Material))
        goal1.add(this.scene.add.box({ x: 0, y: this.goalHeight, width: this.goalWidth }, goal1Material))
        goal1.position.set(0, 0, this.goalDepth)

        this.scene.add.existing(goal1)
        this.scene.physics.add.existing(goal1, { mass: 0, collisionFlags: 1 })


        let goal2 = new ExtendedObject3D()

        goal2.add(this.scene.add.box({ x: this.goalWidth / 2, y: this.goalHeight / 2 - 2, z: 0, height: this.goalHeight }, goal2Material))
        goal2.add(this.scene.add.box({ x: -this.goalWidth / 2, y: this.goalHeight / 2 - 2, z: 0, height: this.goalHeight }, goal2Material))
        goal2.add(this.scene.add.box({ x: 0, y: this.goalHeight, width: this.goalWidth }, goal2Material))
        goal2.position.set(0, 0, -this.goalDepth)

        this.scene.add.existing(goal2)
        this.scene.physics.add.existing(goal2, { mass: 0, collisionFlags: 1 })
    }

    createCourt(texture: Texture) {
        let ground0 = this.scene.physics.add.box({ width: this.courtWidth, height: 0.3, depth: this.courtDepth, y: 0, mass: 0, }, { lambert: { map: texture } })
        ground0.body.setFriction(100)
        ground0.body.setBounciness(0.8)
        ground0.body.setGravity(0, -9.8, 0)
        let wireframe = false


        const ramp1 = this.scene.add.box({ width: this.courtWidth, height: this.rampHeight, z: this.courtDepth / 2 + this.rampHeightOffset, y: this.rampHeightOffset }, { lambert: { map: texture, wireframe } })
        ramp1.rotateX(this.rampAngle)
        this.scene.physics.add.existing(ramp1, { collisionFlags: 1, mass: 0 })

        const ramp2 = this.scene.add.box({ width: this.courtWidth, height: this.rampHeight, z: -this.courtDepth / 2 - this.rampHeightOffset, y: this.rampHeightOffset }, { lambert: { map: texture, wireframe } })

        ramp2.rotateX(-this.rampAngle)
        this.scene.physics.add.existing(ramp2, { collisionFlags: 1, mass: 0 })

        const ramp3 = this.scene.add.box({ width: this.courtDepth, height: this.rampHeight, x: this.courtWidth / 2 + this.rampHeightOffset, y: this.rampHeightOffset }, { lambert: { map: texture, wireframe } })
        ramp3.rotateY(Math.PI / 2)
        ramp3.rotateX(this.rampAngle)
        this.scene.physics.add.existing(ramp3, { collisionFlags: 1, mass: 0 })

        const ramp4 = this.scene.add.box({ width: this.courtDepth, height: this.rampHeight, x: -this.courtWidth / 2 - this.rampHeightOffset, y: this.rampHeightOffset }, { lambert: { map: texture, wireframe } })
        ramp4.rotateY(-Math.PI / 2)
        ramp4.rotateX(this.rampAngle)
        this.scene.physics.add.existing(ramp4, { collisionFlags: 1, mass: 0 })

    }


    checkIfObjectOutOfBounds(object: SimpleVector) {
        let x: number, y: number, z: number

        x = object.x
        y = object.y
        z = object.z

        return (x > this.courtWidth / 2 + this.rampHeightOffset + 10 || x < -this.courtWidth / 2 - this.rampHeightOffset - 10 || z > this.courtDepth / 2 + this.rampHeightOffset + 10 || z < -this.courtDepth / 2 - this.rampHeightOffset - 10)
    }

    checkIfGoal(ball: ExtendedObject3D): number {
        const x = ball.position.x
        const z = ball.position.z
        if (x > -this.goalWidth / 2 && x < this.goalWidth / 2 && z < this.goalDepth && z > this.goalDepth - 1) {
            return 1
        }
        else if (x > -this.goalWidth / 2 && x < this.goalWidth / 2 && z < -this.goalDepth && z > -this.goalDepth - 1) {
            return 2

        }
        return -1
    }


}