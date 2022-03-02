import { ClosestRaycaster } from "@enable3d/ammo-physics";
import { BufferGeometry, Line, LineBasicMaterial, Vector3 } from "three";
import { IGameScene } from '../game/IGameScene';
import { MyScene } from "../game/MyScene";
import { VehicleColorType, VehicleType } from "../shared-backend/shared-stuff";
import { vehicleItems } from "../shared-backend/vehicleItems";
import { numberScaler } from "../utils/utilFunctions";
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


    constructor(scene: MyScene, color: string | number, name: string, vehicleNumber: number, vehicleType: VehicleType, useSoundEffects: boolean) {
        super({ id: `test-vehicle-${vehicleNumber}`, scene, name, vehicleNumber, vehicleType, useSoundEffects, vehicleSetup: { vehicleType: vehicleType, exhaust: vehicleItems[vehicleType]?.exhaust1, vehicleColor: color as VehicleColorType } })
        this.closestRaycaster = this.scene.physics.add.raycaster("closest") as ClosestRaycaster
        //  this.vehicleConfig.maxSpeed = 1000
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
        this.vehicleConfig[key] = value
        if (this[key] !== undefined) {
            this[key] = value
        }
        this.updateWheelsSuspension()
    }

    getVehicleConfigKey(key: keyof IVehicleConfig) {
        if (instanceOfSimpleVector(this.vehicleConfig[key])) {
            const val = this.getLocalStorageVec(key) ?? this.vehicleConfig[key]
            this.setVehicleConfigKey(key, val)
            return val
        } else {
            const val = this.getLocalStorage(key) ?? this.vehicleConfig[key]
            this.setVehicleConfigKey(key, val)
            return val
        }

    }


    setInertia(inertia: SimpleVector) {

        this.vehicleConfig.inertia = inertia
        const { x, y, z } = inertia
        this.setLocalStorageVec("inertia", inertia)

        this.vehicle.getRigidBody().setMassProps(this.vehicleConfig.mass, new Ammo.btVector3(x, y, z))

    }

    getInertia(): SimpleVector {
        let i = this.getLocalStorageVec("inertia") ?? this.vehicleConfig.inertia
        this.setInertia(i)

        return i
    }

    /** Maybe better to have one vector we set values to, instead of always new */
    getAmmoInertia(): Ammo.btVector3 {
        const { x, y, z } = this.vehicleConfig.inertia
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

    updateMaxSpeed(speed?: number) {
        speed = speed ?? this.vehicleConfig.maxSpeed
        this.setLocalStorage("maxSpeed", speed)
        this.vehicleConfig.maxSpeed = speed
        this.vehicleConfig.maxSpeed = speed
        this.setVehicleConfigKey("maxSpeed", speed)

        this.extraSpeedScaler = numberScaler(0, this.vehicleConfig.maxSpeed, Math.log2(1), Math.log2(800), 2)

    }

    updateBreakingForce(breakingForce: number) {
        this.setLocalStorage("breakingForce", breakingForce)
        this.breakingForce = breakingForce
    }

    randomDrive() {
        if (Math.random() < .3) {
            this.goForward()
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

            }
        }


        const right = -Math.PI / 4
        this.l3.set(
            p.x + ((Math.sin(r.y + right) * lineLenght)),
            p.y,
            p.z + ((Math.cos(r.y + right) * lineLenght) * Math.sign(Math.cos(r.z)))
        )



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

            }
        }
    }
}


