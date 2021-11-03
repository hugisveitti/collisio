import { instanceOfSimpleVector, SimpleVector } from "./IVehicle";
import { LowPolyVehicle } from "./LowPolyVehicle";
import { defaultVehicleConfig, IVehicleConfig, vehicleConfigs } from "./VehicleConfigs";

export class LowPolyTestVehicle extends LowPolyVehicle {

    setLocalStorageVec(key: keyof IVehicleConfig, vec: SimpleVector) {
        window.localStorage.setItem(`${key}-${this.vehicleType}-x`, vec.x + "")
        window.localStorage.setItem(`${key}-${this.vehicleType}-y`, vec.y + "")
        window.localStorage.setItem(`${key}-${this.vehicleType}-z`, vec.z + "")
    }

    getLocalStorageVec(key: keyof IVehicleConfig) {
        const x = +window.localStorage.getItem(`${key}-${this.vehicleType}-x`)
        const y = +window.localStorage.getItem(`${key}-${this.vehicleType}-y`)
        const z = +window.localStorage.getItem(`${key}-${this.vehicleType}-z`)

        return { x, y, z } as SimpleVector
    }

    setLocalStorage(key: keyof IVehicleConfig, value: any) {
        window.localStorage.setItem(`${key}-${this.vehicleType}`, value)
    }

    getLocalStorage(key: keyof IVehicleConfig) {
        return window.localStorage.getItem(`${key}-${this.vehicleType}`)
    }

    setVehicleConfigKey(key: keyof IVehicleConfig, value: number | SimpleVector | string | boolean) {
        if (instanceOfSimpleVector(value)) {
            this.setLocalStorageVec(key, value)
        } else {
            this.setLocalStorage(key, value)
        }
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
        const i = this.getLocalStorageVec("inertia") ?? vehicleConfigs[this.vehicleType].inertia
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
        for (let key in defaultVehicleConfig) {
            if (instanceOfSimpleVector(defaultVehicleConfig[key])) {
                this.setLocalStorageVec(key as keyof IVehicleConfig, defaultVehicleConfig[key])
            } else {
                this.setLocalStorage(key as keyof IVehicleConfig, defaultVehicleConfig[key])
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

}