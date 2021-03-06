import { ExtendedObject3D } from "enable3d"
import { Audio, Color, MeshStandardMaterial, Vector3 } from "three"
import { MyScene } from "../game/MyScene"
import { getBeep } from "../sounds/gameSounds"
import { isVehicle } from "../vehicles/LowPolyVehicle"


/**
 * red is on you and bad for you
 * green is on you and good for you
 * purple is on others and bad for them
 */
export type PowerupType = "good" | "bad" | "others"
type PowerupColor = "red" | "green" | "purple"
export interface Powerup {
    name: string
    speedMult?: number
    invertedController?: boolean
    color: PowerupColor,
    toOthers?: boolean,
    noBreaks?: boolean
    /** seconds, how long the powerup should last */
    time: number
    type: PowerupType
    onlyForward?: boolean
    accelerationMult?: number
    delay?: number
}



const fasterPowerup: Powerup = {
    name: "Faster",
    speedMult: 1.5,
    color: "green",
    time: 2,
    type: "good"
}

const accelerationPowerup: Powerup = {
    name: "More Acceleration",
    accelerationMult: 1.8,
    color: "green",
    time: 3,
    type: "good",
    speedMult: 1.2,
}

const slowerPowerup: Powerup = {
    name: "Slower",
    speedMult: 0.5,
    color: "red",
    time: 1.5,
    type: "bad"
}

export const outofControlPowerup: Powerup = {
    name: "Turbo!!",
    speedMult: 1.7,
    noBreaks: true,
    color: "purple",
    onlyForward: true,
    toOthers: true,
    time: 1,
    type: "others",
    accelerationMult: 1.1,
}

const otherSlowerPowerup: Powerup = {
    name: "Slower",
    speedMult: 0.5,
    color: "purple",
    toOthers: true,
    time: 2,
    type: "others"

}
const otherInvertedControllerPowerup: Powerup = {
    name: "Inverted controls",
    invertedController: true,
    color: "purple",
    toOthers: true,
    time: 1,
    type: "others",
    delay: 1,
}

// no breaks and speed mult?
const otherNoBreaksPowerup: Powerup = {
    name: "No breaks",
    noBreaks: true,
    color: "purple",
    toOthers: true,
    time: 2,
    type: "others",
}

const otherOnlyForwardPowerup: Powerup = {
    name: "Turbo!!",
    speedMult: 2.4,
    noBreaks: true,
    color: "purple",
    onlyForward: true,
    toOthers: true,
    time: 1,
    type: "others",
    accelerationMult: 1.3,
}


const goodPowers = [fasterPowerup, accelerationPowerup]
const badPowers = [slowerPowerup, outofControlPowerup]
const otherPowers = [otherSlowerPowerup, otherInvertedControllerPowerup, otherNoBreaksPowerup, otherOnlyForwardPowerup]
const powers: Powerup[][] = [goodPowers, badPowers, otherPowers]

// export type PowerupType = "Faster" | "Slower" | "Other go slower" | "Inverted controller" | "Other inverted controller"


const getRandomPower = (): Powerup => {
    const r = Math.floor(Math.random() * powers.length)
    const r1 = Math.floor(Math.random() * powers[r].length)
    return powers[r][r1]

}

export class PowerupBox {

    position: Vector3
    box: ExtendedObject3D
    gameScene: MyScene
    power: Powerup
    dy = 0.025
    model: ExtendedObject3D

    active: boolean
    nonActiveTimeout: NodeJS.Timeout

    soundGood: Audio
    soundBad: Audio
    soundOthers: Audio

    constructor(position: Vector3, model: ExtendedObject3D, gameScene: MyScene) {
        this.position = position
        this.model = model
        this.gameScene = gameScene
        this.power = getRandomPower();
        this.gameScene.scene.add(this.model);
        this.active = true;

        this.setColor()
        //  this.setNewPosition()
        this.model.position.set(this.position.x, this.position.y, this.position.z)
        this.model.castShadow = true

        this.box = this.gameScene.physics.add.box({
            collisionFlags: 6, // kinametic ghost
            width: 2,
            height: 3,
            depth: 2,

            x: this.position.x, y: this.position.y + 1.9, z: this.position.z
        }, { visible: false });
        (this.box.material as MeshStandardMaterial).visible = false
        this.setupCollision()
        this.loadSounds()
    }

    toggleShadow(useShadow: boolean) {
        this.model.castShadow = useShadow
    }

    // just move it randomly in z and x a little bit
    setNewPosition() {
        const x = (Math.random() * 10) - 5
        const z = (Math.random() * 10) - 5
        this.position.set(this.position.x + x, this.position.y, this.position.z + z)
    }

    loadSounds() {
        getBeep("sound/powerup-good.ogg", this.gameScene.listener, (sound) => {
            sound.setVolume(0.1)
            this.soundGood = sound
        })
        getBeep("sound/powerup-bad.ogg", this.gameScene.listener, (sound) => {
            sound.setVolume(0.1)
            this.soundBad = sound
        })
        getBeep("sound/powerup-others.ogg", this.gameScene.listener, (sound) => {
            sound.setVolume(0.1)
            this.soundOthers = sound
        })
    }

    setColor() {
        (this.model.material as MeshStandardMaterial) = (this.model.material as MeshStandardMaterial).clone();
        (this.model.material as MeshStandardMaterial).color = new Color(this.power.color);
    }

    playSound() {
        if (!this.gameScene.gameSettings.useSound) return
        if (this.power.type === "bad") {
            this.soundBad?.play()
        } else if (this.power.type === "good") {
            this.soundGood?.play()
        } else if (this.power.type === "others") {
            this.soundOthers?.play()
        }
    }

    setupCollision() {
        this.box.body.on.collision((o: ExtendedObject3D, ev) => {
            if (!this.active) return
            if (isVehicle(o)) {
                this.gameScene.hitPowerup(o, this.power)
                this.playSound()
                this.active = false
                this.model.visible = false
                this.nonActiveTimeout = setTimeout(() => {
                    this.model.visible = true
                    this.active = true
                    this.power = getRandomPower()
                    this.setColor()
                }, 3000)
            }
        })
    }

    // move up and down
    update() {
        const p = this.model.position
        this.model.position.setY(p.y + this.dy)
        if (p.y > this.position.y + .5 || p.y < this.position.y - .3) {
            this.dy = -this.dy
        }

        this.model.rotateY(0.02)
    }

    destroy() {
        this.gameScene.destroy(this.model)
        clearTimeout(this.nonActiveTimeout)
    }
}