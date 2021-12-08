import { LineBasicMaterial, Line, BufferGeometry, Vector3 } from "three"
import { IGameScene } from '../game/IGameScene';
import { VehicleType } from "../shared-backend/shared-stuff";
import { instanceOfSimpleVector, SimpleVector } from "./IVehicle";
import { LowPolyVehicle } from "./LowPolyVehicle";
import { initialVehicleConfigs, IVehicleConfig, vehicleConfigs } from "./VehicleConfigs";


const intelligentDriveLine = false

export class LowPolyTestVehicle extends LowPolyVehicle {

    //    closestRaycaster: ClosestRaycaster
    line: Line



    constructor(scene: IGameScene, color: string | number, name: string, vehicleNumber: number, vehicleType: VehicleType, useEngineSound: boolean) {
        super(scene, color, name, vehicleNumber, vehicleType, useEngineSound)
        // this.closestRaycaster = this.scene.physics.add.raycaster("closest") as ClosestRaycaster
        //  vehicleConfigs[this.vehicleType].maxSpeed = 1000
        if (intelligentDriveLine) {

            const material = new LineBasicMaterial({ color: 0x0000ff })
            const geometry = new BufferGeometry().setFromPoints([
                new Vector3(0, 0, 0),
                new Vector3(2, -10, 0)
            ])
            this.line = new Line(geometry, material)
            this.scene.add.existing(this.line)
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
        return new Ammo.btVector3(x, y, z)
    }

    /** This is actually setting the position of the chassis relative to the world, 
     * To actually set the center of mass, then would probably have to do it when creating the mesh,https://pybullet.org/Bullet/phpBB3/viewtopic.php?t=2209
     */
    setCenterOfMass(vec: SimpleVector) {
        let tf = new Ammo.btTransform()
        tf.setOrigin(new Ammo.btVector3(vec.x, vec.y, vec.z))
        this.chassisMesh.body.ammo.setCenterOfMassTransform(tf)
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
        this.chassisMesh.body.ammo.getCollisionShape().calculateLocalInertia(mass, inertia)

        this.vehicle.getRigidBody().setMassProps(this.mass, inertia)
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
        console.warn("no intelligent drive")

        //  const p = this.getPosition()
        // const tm = this.vehicle.getWheelInfo(2).get_m_worldTransform();
        // const po = tm.getOrigin()
        // const q = tm.getRotation()
        // const r = this.chassisMesh.rotation
        // const p = this.getPosition()
        // let px = po.x()
        // let py = po.y()
        // let pz = po.z()

        // px = p.x
        // py = p.y
        // pz = p.z

        // const tm1 = this.vehicle.getWheelInfo(3).get_m_worldTransform();
        // const po1 = tm.getOrigin()

        // const w = this.vehicle.getWheelInfo(2).get_m_wheelDirectionCS()

        // const d = this.chassisMesh.getWorldDirection(new Vector3(px, py, pz))
        // const offset = 1

        // const rx = ((Math.sin(r.y) * offset)) + Math.PI / 2
        // const ry = r.y// 0// Math.PI / 2 // p.y
        // const rz = ((Math.cos(r.y) * offset) * Math.sign(Math.cos(r.z))) - Math.PI


        // this.closestRaycaster.setRayFromWorld(rx, ry, rz)
        // this.closestRaycaster.setRayToWorld(px, py, pz)
        // if (intelligentDriveLine) {

        //     this.line.position.set(px, py, pz)
        //     this.line.rotation.set(rx, ry, rz)
        // }


        // this.closestRaycaster.rayTest()
        // if (this.closestRaycaster.hasHit()) {
        //     //  const { x, y, z } = this.closestRaycaster.getHitPointWorld()
        //     const obj = this.closestRaycaster.getCollisionObject()
        //     if (log) {

        //         // console.log("closest", x, y, z)
        //         // console.log("hit object", obj)
        //     }


        // }
    }
}