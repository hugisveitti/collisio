import { ExtendedObject3D, Scene3D } from "enable3d"
import * as THREE from '@enable3d/three-wrapper/dist/index';
import { IPositionRotation, IVehicle } from "./IVehicle"

const boxDim = { depth: 1, height: 1, width: 1 }


interface TurnAxis {
    left: Ammo.btHingeConstraint
    right: Ammo.btHingeConstraint
}
export class ConstraintVehicle implements IVehicle {
    leftBackMotor: Ammo.btHingeConstraint
    rightBackMotor: Ammo.btHingeConstraint
    leftFrontMotor: Ammo.btHingeConstraint
    rightFrontMotor: Ammo.btHingeConstraint
    frame: ExtendedObject3D
    turnAxis: TurnAxis
    canDrive: boolean
    isPaused: boolean
    mass: number
    constructor(leftBackMotor: Ammo.btHingeConstraint,
        rightBackMotor: Ammo.btHingeConstraint,
        leftFrontMotor: Ammo.btHingeConstraint,
        rightFrontMotor: Ammo.btHingeConstraint,
        frame: ExtendedObject3D,
        turnAxis: TurnAxis
    ) {
        this.leftBackMotor = leftBackMotor
        this.rightBackMotor = rightBackMotor
        this.leftFrontMotor = leftFrontMotor
        this.rightFrontMotor = rightFrontMotor
        this.frame = frame
        this.turnAxis = turnAxis
        this.canDrive = true
        this.isPaused = false
        this.mass = 800
    }


    goForward(moreSpeed: boolean) {
        const speed = 40
        this.leftBackMotor.enableAngularMotor(true, -speed, 0.25)
        this.rightBackMotor.enableAngularMotor(true, -speed, 0.25)
        this.leftFrontMotor.enableAngularMotor(true, -speed, 0.25)
        this.rightFrontMotor.enableAngularMotor(true, -speed, 0.25)
    }

    goBackward(speed: number) {
        this.leftBackMotor.enableAngularMotor(true, speed, 0.25)
        this.rightBackMotor.enableAngularMotor(true, speed, 0.25)
        this.leftFrontMotor.enableAngularMotor(true, speed, 0.25)
        this.rightFrontMotor.enableAngularMotor(true, speed, 0.25)
    }

    noForce() {
        this.leftBackMotor.enableAngularMotor(true, 0, 0.05)
        this.rightBackMotor.enableAngularMotor(true, 0, 0.05)
        this.leftFrontMotor.enableAngularMotor(true, 0, 0.05)
        this.rightFrontMotor.enableAngularMotor(true, 0, 0.05)
    }

    turnLeft(angle: number) {
        this.turnAxis.left.setMotorTarget(-Math.PI / 4, 0.5)
        this.turnAxis.right.setMotorTarget(-Math.PI / 4, 0.5)
    }

    turnRight(angle: number) {
        this.turnAxis.left.setMotorTarget(Math.PI / 4, 0.5)
        this.turnAxis.right.setMotorTarget(Math.PI / 4, 0.5)
    }

    noTurn() {
        this.turnAxis.left.setMotorTarget(0, 0.5)
        this.turnAxis.right.setMotorTarget(0, 0.5)
    }

    turn(angle: number) {
        console.log("turn has not been implemented for constraint vehicle")
    }


    stop() {
        console.log("stop not impl")
    }

    start() {
        console.log("start not impl")
    }

    pause() {
        console.log("pause not impl")
    }

    unpause() {
        console.log("unpause not impl")
    }

    // Some typescript error trying to set it to PerspectiveCamera
    addCamera(camera: any) {
        this.frame.add(camera)
    }

    cameraLookAt(camera: any) {

        camera.lookAt(this.frame.position.clone())
    }

    update() {

    }

    break(noBreak?: boolean) {
        if (!noBreak) {

            this.leftBackMotor.enableAngularMotor(true, 0, 0.5)
            this.rightBackMotor.enableAngularMotor(true, 0, 0.5)
            this.leftFrontMotor.enableAngularMotor(true, 0, 0.5)
            this.rightFrontMotor.enableAngularMotor(true, 0, 0.5)
        }
    }


    setPosition(x: number, y: number, z: number) {
        this.frame.body.setPosition(x, y, z)
    }
    setRotation(x: number, y: number, z: number) { }

    getPosition() {
        return { x: 0, y: 0, z: 0 }
    }

    getRotation() {
        return { x: 0, y: 0, z: 0 }
    }

    getCurrentSpeedKmHour() {
        return -1
    }

    setFont(font: THREE.Font) {
        console.log("setFont not implemented")
    }

    lookForwardsBackwards(lookBackwards: boolean) {
        console.log("lookForwardsBackwards not implemented")
    }

    resetPosition() {
        console.log("reset position not implemented")
    }

    setCheckpointPositionRotation(positionRotation: IPositionRotation) {
        console.log("set checkpoint not implemented for constraint vehicle")
    }
}

const createWheel = (x: number, z: number, scene: Scene3D) => {
    const wheel = scene.add.cylinder(
        { mass: 20, radiusBottom: .50, radiusTop: .50, radiusSegments: 24, height: 0.35, },
        { lambert: { color: 0x111111, opacity: 0.5 } }
    )
    wheel.position.set(x, 1, z)

    wheel.rotateZ(Math.PI / 2)
    scene.physics.add.existing(wheel)
    wheel.body.setFriction(3)
    return wheel
}

const createRotor = (x: number, z: number, scene: Scene3D) => {
    const rotor = scene.add.cylinder(
        { mass: 10, radiusBottom: 0.3, radiusTop: 0.3, radiusSegments: 24, height: 0.5, },
        { lambert: { color: 'gray', opacity: 0.5 } }
    )
    rotor.position.set(x, 1, z)

    rotor.rotateZ(Math.PI / 2)
    scene.physics.add.existing(rotor)
    return rotor

}

const createVehicleFrame = (z: number, x: number, scene: Scene3D, color: string | number | undefined, mass: number) => {
    let wireframe = false
    const frame = new ExtendedObject3D()

    const cylinder = scene.add.cylinder(
        { y: 1, width: 1.8, mass, height: 2.5 },
        { lambert: { wireframe, color } }
    )
    frame.add(cylinder)

    frame.add(
        scene.add.cylinder(
            { y: 2.2, width: 1.5, height: 1.5, radiusTop: .3, radiusBottom: 0.9, mass: 5000, },
            { lambert: { wireframe, color } }
        )
    )

    const smallCylinder = scene.add.cylinder(
        { y: .3, z: -1.5, width: 0.5, mass: 5, height: .5, radiusBottom: .4, radiusTop: .4 },
        { lambert: { wireframe, color } }
    )
    frame.add(smallCylinder)


    const plank = scene.add.box({
        y: 0, height: .4, width: 2.2, depth: 4
    }, { lambert: { color: 0x114433, wireframe } })
    frame.add(
        plank
    )
    frame.position.set(x, 1, z)


    scene.add.existing(frame)
    return frame
}


const createAxis = (z: number, x: number, radius: number, scene: Scene3D) => {
    const axis = scene.add.cylinder(
        { mass: 10, radiusTop: radius, radiusBottom: radius, height: 2.6 },
        { lambert: { color: 0x555466, opacity: 0.5 } }
    )
    axis.position.set(x, 1, z)
    axis.rotateZ(Math.PI / 2)
    scene.physics.add.existing(axis)
    return axis
}

const axisToRotor = (rotorRight: ExtendedObject3D, rotorLeft: ExtendedObject3D, axis: ExtendedObject3D, z: number, x: number, scene: Scene3D) => {
    const right = scene.physics.add.constraints.hinge(rotorRight.body, axis.body, {
        pivotA: { y: 0.2, z },
        pivotB: { y: -1.3 },
        axisA: { x },
        axisB: { x }
    })
    const left = scene.physics.add.constraints.hinge(rotorLeft.body, axis.body, {
        pivotA: { y: -0.2, z },
        pivotB: { y: 1.3 },
        axisA: { x },
        axisB: { x }
    })
    return { right, left } as TurnAxis
}


export const createConstraintVehicle = (scene: Scene3D, color: number | string, x: number = 0, z: number = 0) => {



    const wheelX = 1.5,
        wheelZ = 2,
        axisZ = 0.2

    const rightX = x + wheelX
    const leftX = x - wheelX
    const frontZ = z - wheelZ
    const backZ = z + wheelZ


    const wheelBackRight = createWheel(rightX, backZ, scene)
    const wheelBackLeft = createWheel(leftX, backZ, scene)
    const wheelFrontRight = createWheel(rightX, frontZ, scene) // right front
    const wheelFrontLeft = createWheel(leftX, frontZ, scene)


    const rotorBackRight = createRotor(rightX, backZ, scene)
    const rotorBackLeft = createRotor(leftX, backZ, scene)
    const rotorFrontRight = createRotor(rightX, frontZ, scene)
    const rotorFrontLeft = createRotor(leftX, frontZ, scene)



    const wheelToRotorConstraint = { axisA: { y: 1 }, axisB: { y: 1 } }
    const leftBackMotor = scene.physics.add.constraints.hinge(
        wheelBackLeft.body,
        rotorBackLeft.body,
        wheelToRotorConstraint
    )
    const rightBackMotor = scene.physics.add.constraints.hinge(
        wheelBackRight.body,
        rotorBackRight.body,
        wheelToRotorConstraint
    )
    const leftFrontMotor = scene.physics.add.constraints.hinge(
        wheelFrontLeft.body,
        rotorFrontLeft.body,
        wheelToRotorConstraint
    )
    const rightFrontMotor = scene.physics.add.constraints.hinge(
        wheelFrontRight.body,
        rotorFrontRight.body,
        wheelToRotorConstraint
    )

    const axisBack = createAxis(backZ, x, 0.06, scene)
    const axisFrontSteer = createAxis(frontZ + axisZ, x, 0.04, scene)
    const axisFrontDrive = createAxis(frontZ - axisZ, x, 0.06, scene)

    scene.physics.add.constraints.lock(rotorBackRight.body, axisBack.body)
    scene.physics.add.constraints.lock(rotorBackLeft.body, axisBack.body)

    let m0 = axisToRotor(rotorFrontRight, rotorFrontLeft, axisFrontDrive, 0, 1, scene)
    axisToRotor(rotorFrontRight, rotorFrontLeft, axisFrontSteer, 0.4, 1, scene)

    //let m0 = undefined
    const frame = createVehicleFrame(z, x, scene, color, 800)

    scene.physics.add.existing(frame)


    scene.physics.add.constraints.lock(frame.body, axisBack.body)
    scene.physics.add.constraints.lock(frame.body, rotorBackRight.body,)
    scene.physics.add.constraints.lock(frame.body, rotorBackLeft.body,)
    scene.physics.add.constraints.lock(frame.body, axisFrontDrive.body)

    // // scene.physics.add.constraints.lock(frame.body, rotorFrontLeft.body)
    // // scene.physics.add.constraints.lock(frame.body, rotorFrontRight.body)



    m0.left.enableAngularMotor(true, 0, 1000)
    m0.right.enableAngularMotor(true, 0, 1000)


    const limit = 0.3
    const dofSettings = {
        angularLowerLimit: { x: 0, y: 0, z: 0 },
        angularUpperLimit: { x: 0, y: 0, z: 0 },
        linearLowerLimit: { x: 0, y: -limit, z: 0.1 },
        linearUpperLimit: { x: 0, y: limit, z: 0.1 }
    }

    scene.physics.add.constraints.dof(frame.body, axisFrontSteer.body, { ...dofSettings, offset: { y: 0.9 } })
    scene.physics.add.constraints.dof(frame.body, axisFrontSteer.body, { ...dofSettings, offset: { y: -0.9 } })

    const car = new ConstraintVehicle(leftBackMotor, rightBackMotor, leftFrontMotor, rightFrontMotor, frame, m0)

    // const car = new ExtendedObject3D()
    // car.add(wheelFrontRight)
    // car.add(wheelFrontLeft)
    // car.add(wheelBackLeft)
    // car.add(wheelBackRight)
    // car.add(rotorFrontRight)
    // car.add(rotorFrontLeft)
    // car.add(rotorBackLeft)
    // car.add(rotorBackRight)
    // car.add(axisBackOne)
    // car.add(axisFrontOne)
    // car.add(axisFrontTwo)

    // car.add(frame)
    // scene.add.existing(car)
    //car.position.set(Math.random() * 10, 10, 1)
    //car.rotateY(45)

    return car
}