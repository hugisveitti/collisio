import { ClosestRaycaster } from "@enable3d/ammo-physics";
import { BufferGeometry, Line, LineBasicMaterial, Vector3 } from "three";
import { IGameScene } from '../game/IGameScene';
import { VehicleType } from "../shared-backend/shared-stuff";
import { instanceOfSimpleVector, ITestVehicle, SimpleVector } from "./IVehicle";
import { LowPolyVehicle } from "./LowPolyVehicle";
import { initialVehicleConfigs, IVehicleConfig, vehicleConfigs } from "./VehicleConfigs";


const intelligentDriveLine = true

export class LowPolyTestVehicle extends LowPolyVehicle implements ITestVehicle {

    closestRaycaster: ClosestRaycaster
    lineForward: Line
    lineLeft: Line
    lineRight: Line

    l1: Vector3
    l2: Vector3
    l3: Vector3
    l4: Vector3

    inertia: Ammo.btVector3


    constructor(scene: IGameScene, color: string | number, name: string, vehicleNumber: number, vehicleType: VehicleType, useSoundEffects: boolean) {
        super({ scene, vehicleColor: color, name, vehicleNumber, vehicleType, useSoundEffects })
        this.closestRaycaster = this.scene.physics.add.raycaster("closest") as ClosestRaycaster
        //  vehicleConfigs[this.vehicleType].maxSpeed = 1000
        this.inertia = new Ammo.btVector3(0, 0, 0)
        if (intelligentDriveLine) {

            this.l1 = new Vector3(0, 0, 0)
            this.l2 = new Vector3(2, -10, 0)
            this.l3 = new Vector3(2, -10, 0)
            this.l4 = new Vector3(2, -10, 0)
            const material = new LineBasicMaterial({ color: 0x0000ff })
            const geometry = new BufferGeometry().setFromPoints([
                this.l1, this.l2
            ])
            this.lineForward = new Line(geometry, material)



            this.lineRight = new Line(geometry.clone(), material)
            this.lineLeft = new Line(geometry.clone(), material)
            this.scene.scene.add(this.lineForward)
            this.scene.scene.add(this.lineLeft)
            this.scene.scene.add(this.lineRight)


        }

    }

    setLocalStorageVec(key: keyof IVehicleConfig, vec: SimpleVector) {
        window.localStorage.setItem(`${key}-${this.vehicleType}-x`, vec.x + "")
        window.localStorage.setItem(`${key}-${this.vehicleType}-y`, vec.y + "")
        window.localStorage.setItem(`${key}-${this.vehicleType}-z`, vec.z + "")
    }

    getLocalStorageVec(key: keyof IVehicleConfig) {
        if (!window.localStorage.getItem(`${key}-${this.vehicleType}-x`)) {
            return undefined
        }
        const x = +window.localStorage.getItem(`${key}-${this.vehicleType}-x`)
        const y = +window.localStorage.getItem(`${key}-${this.vehicleType}-y`)
        const z = +window.localStorage.getItem(`${key}-${this.vehicleType}-z`)


        return { x, y, z } as SimpleVector
    }

    setLocalStorage(key: keyof IVehicleConfig, value: any) {
        window.localStorage.setItem(`${key}-${this.vehicleType}`, value)
    }

    getLocalStorage(key: keyof IVehicleConfig) {
        return +window.localStorage.getItem(`${key}-${this.vehicleType}`)
    }

    setVehicleConfigKey(key: keyof IVehicleConfig, value: number | SimpleVector | string | boolean) {
        if (instanceOfSimpleVector(value)) {
            this.setLocalStorageVec(key, value)
        } else {
            this.setLocalStorage(key, value)
        }
        // this is for engineForce
        // @ts-ignore
        vehicleConfigs[this.vehicleType][key] = value
        if (this[key] !== undefined) {
            this[key] = value
        }
        this.updateWheelsSuspension()
    }

    getVehicleConfigKey(key: keyof IVehicleConfig) {
        if (instanceOfSimpleVector(vehicleConfigs[this.vehicleType][key])) {
            const val = this.getLocalStorageVec(key) ?? vehicleConfigs[this.vehicleType][key]
            this.setVehicleConfigKey(key, val)
            return val
        } else {
            const val = this.getLocalStorage(key) ?? vehicleConfigs[this.vehicleType][key]
            this.setVehicleConfigKey(key, val)
            return val
        }

    }


    setInertia(inertia: SimpleVector) {

        vehicleConfigs[this.vehicleType].inertia = inertia
        const { x, y, z } = inertia
        this.setLocalStorageVec("inertia", inertia)

        this.vehicle.getRigidBody().setMassProps(this.mass, new Ammo.btVector3(x, y, z))

    }

    getInertia(): SimpleVector {
        let i = this.getLocalStorageVec("inertia") ?? vehicleConfigs[this.vehicleType].inertia
        this.setInertia(i)

        return i
    }

    /** Maybe better to have one vector we set values to, instead of always new */
    getAmmoInertia(): Ammo.btVector3 {
        const { x, y, z } = vehicleConfigs[this.vehicleType].inertia
        this.inertia.setValue(x, y, z)
        return this.inertia
    }

    /** This is actually setting the position of the chassis relative to the world, 
     * To actually set the center of mass, then would probably have to do it when creating the mesh,https://pybullet.org/Bullet/phpBB3/viewtopic.php?t=2209
     */
    setCenterOfMass(vec: SimpleVector) {
        this.vector.setValue(vec.x, vec.y, vec.z)
        this.tm.setOrigin(this.vector)
        this.vehicleBody.body.ammo.setCenterOfMassTransform(this.tm)
    }


    getCenterOfMass() {
        const cm = this.vehicle.getRigidBody().getCenterOfMassTransform()
        return {
            x: cm.getOrigin().x(), y: cm.getOrigin().y(), z: cm.getOrigin().z()
        }
    }
    /** not com */


    resetConfigToDefault() {
        for (let key in initialVehicleConfigs[this.vehicleType]) {
            if (instanceOfSimpleVector(initialVehicleConfigs[this.vehicleType][key])) {
                // @ts-ignore
                this.setLocalStorageVec(key as keyof IVehicleConfig, initialVehicleConfigs[this.vehicleType][key] as SimpleVector)
            } else {
                this.setLocalStorage(key as keyof IVehicleConfig, initialVehicleConfigs[this.vehicleType][key])
            }
        }
    }



    updateWheelsSuspension() {

        this.tuning.set_m_suspensionStiffness(vehicleConfigs[this.vehicleType].suspensionStiffness);
        this.tuning.set_m_suspensionCompression(vehicleConfigs[this.vehicleType].suspensionCompression);
        this.tuning.set_m_suspensionDamping(vehicleConfigs[this.vehicleType].suspensionDamping);

        this.tuning.set_m_maxSuspensionTravelCm(vehicleConfigs[this.vehicleType].maxSuspensionTravelCm);
        this.tuning.set_m_frictionSlip(vehicleConfigs[this.vehicleType].frictionSlip);
        this.tuning.set_m_maxSuspensionForce(vehicleConfigs[this.vehicleType].maxSuspensionForce);


        for (let i = 0; i < this.vehicle.getNumWheels(); i++) {
            const wheelInfo = this.vehicle.getWheelInfo(i)

            wheelInfo.set_m_suspensionRestLength1(vehicleConfigs[this.vehicleType].suspensionRestLength)
            wheelInfo.set_m_suspensionStiffness(vehicleConfigs[this.vehicleType].suspensionStiffness)

            wheelInfo.set_m_wheelsDampingRelaxation(vehicleConfigs[this.vehicleType].suspensionDamping)
            wheelInfo.set_m_wheelsDampingCompression(vehicleConfigs[this.vehicleType].suspensionDamping)

            wheelInfo.set_m_frictionSlip(vehicleConfigs[this.vehicleType].frictionSlip)
            wheelInfo.set_m_rollInfluence(vehicleConfigs[this.vehicleType].rollInfluence)
            //    wheelInfo.updateWheel(this.vehicle.getRigidBody(), this.vehicle.getRigidBody().)
            this.vehicle.updateSuspension(0)
        }
    }

    updateMass(mass: number) {

        this.mass = mass
        this.setLocalStorage("mass", mass)

        const inertia = this.getAmmoInertia()
        this.vehicleBody.body.ammo.getCollisionShape().calculateLocalInertia(mass, inertia)

        this.vehicle.getRigidBody().setMassProps(this.mass, inertia)
    }

    updateMaxSpeed(speed: number) {
        this.setLocalStorage("maxSpeed", speed)

        vehicleConfigs[this.vehicleType].maxSpeed = speed
        this.setVehicleConfigKey("maxSpeed", speed)

    }

    updateBreakingForce(breakingForce: number) {
        this.setLocalStorage("breakingForce", breakingForce)
        this.breakingForce = breakingForce
    }

    randomDrive() {
        if (Math.random() < .3) {
            this.goForward(false)
        } else if (Math.random() < .05) {
            this.goBackward()
        }

        if (Math.random() < .1) {
            this.turn((Math.random() * 80) - 40)
        }
    }

    intelligentDrive(log: boolean) {
        /** wait with this */



        const p = this.getPosition()
        const tm = this.vehicle.getWheelInfo(2).get_m_worldTransform();

        const r = this.vehicleBody.rotation //  new Euler().setFromQuaternion(q)

        const q = this.getRotation()




        const lineLenght = 20
        this.l1.set(p.x, p.y, p.z)

        this.l2.set(
            p.x + ((Math.sin(r.y) * lineLenght)),
            p.y,
            p.z + ((Math.cos(r.y) * lineLenght) * Math.sign(Math.cos(r.z)))
        )

        this.lineForward.geometry.setFromPoints([this.l1, this.l2])

        this.closestRaycaster.setRayFromWorld(p.x, p.y, p.z)
        this.closestRaycaster.setRayToWorld(this.l2.x, this.l2.y, this.l2.z)

        this.closestRaycaster.rayTest()
        if (this.closestRaycaster.hasHit()) {
            //  const { x, y, z } = this.closestRaycaster.getHitPointWorld()
            const obj = this.closestRaycaster.getCollisionObject()
            if (log) {
                const normal = this.closestRaycaster.getHitNormalWorld()
                console.log("normal", normal)
                console.log("forward hit", obj,)
            }
        }


        const right = -Math.PI / 4
        this.l3.set(
            p.x + ((Math.sin(r.y + right) * lineLenght)),
            p.y,
            p.z + ((Math.cos(r.y + right) * lineLenght) * Math.sign(Math.cos(r.z)))
        )

        //this.lineRight.geometry.setFromPoints([this.l1, this.l3])

        // this.closestRaycaster.setRayFromWorld(p.x, p.y, p.z)
        // this.closestRaycaster.setRayToWorld(this.l3.x, this.l3.y, this.l3.z)

        // this.closestRaycaster.rayTest()
        // if (this.closestRaycaster.hasHit()) {
        //     //  const { x, y, z } = this.closestRaycaster.getHitPointWorld()
        //     const obj = this.closestRaycaster.getCollisionObject()
        //     if (log) {
        //         const normal = this.closestRaycaster.getHitNormalWorld()
        //         const hitPoint = this.closestRaycaster.getHitPointWorld()
        //         console.log("normal", normal)
        //         console.log("hitpoint", hitPoint)
        //         console.log("right hit", obj,)
        //     }
        // }

        const left = Math.PI / 4
        this.l4.set(
            p.x + ((Math.sin(r.y + left) * lineLenght)),
            p.y,
            p.z + ((Math.cos(r.y + left) * lineLenght) * Math.sign(Math.cos(r.z)))
        )

        this.lineLeft.geometry.setFromPoints([this.l1, this.l4])

        this.closestRaycaster.setRayFromWorld(p.x, p.y, p.z)
        this.closestRaycaster.setRayToWorld(this.l4.x, this.l4.y, this.l4.z)

        this.closestRaycaster.rayTest()
        if (this.closestRaycaster.hasHit()) {
            //  const { x, y, z } = this.closestRaycaster.getHitPointWorld()
            const obj = this.closestRaycaster.getCollisionObject()
            if (log) {
                const normal = this.closestRaycaster.getHitNormalWorld()
                console.log("normal", normal)
                console.log("left hit", obj,)
            }
        }
    }
}


