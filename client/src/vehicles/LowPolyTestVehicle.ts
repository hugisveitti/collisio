import { SimpleVector } from "./IVehicle";
import { LowPolyVehicle } from "./LowPolyVehicle";
import { vehicleConfigs } from "./VehicleConfigs";

export class LowPolyTestVehicle extends LowPolyVehicle {

    setInertia(inertia: SimpleVector) {
        vehicleConfigs[this.vehicleType].inertia = inertia
        const { x, y, z } = inertia

        this.vehicle.getRigidBody().setMassProps(this.mass, new Ammo.btVector3(x, y, z))

    }

    getInertia(): SimpleVector {

        return vehicleConfigs[this.vehicleType].inertia
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

    setSuspensionDamping(suspensionDamping: number) {
        vehicleConfigs[this.vehicleType].suspensionDamping = suspensionDamping
        this.updateWheelsSuspension()
    }

    getSuspensionDamping() {
        return vehicleConfigs[this.vehicleType].suspensionDamping
    }

    setSuspensionStiffness(suspensionStiffness: number) {
        vehicleConfigs[this.vehicleType].suspensionStiffness = suspensionStiffness
        this.updateWheelsSuspension()
    }

    getSuspensionStiffness() {

        return vehicleConfigs[this.vehicleType].suspensionStiffness
    }

    setSuspensionCompression(suspensionCompression: number) {
        vehicleConfigs[this.vehicleType].suspensionCompression = suspensionCompression
        this.updateWheelsSuspension()
    }

    getSuspensionCompression() {
        return vehicleConfigs[this.vehicleType].suspensionCompression
    }

    setSuspensionRestLength(suspensionRestLength: number) {
        vehicleConfigs[this.vehicleType].suspensionRestLength = suspensionRestLength
        this.updateWheelsSuspension()
    }

    getSuspensionRestLength() {
        return vehicleConfigs[this.vehicleType].suspensionRestLength
    }

    setMaxSuspensionTravelCm(maxSuspensionTravelCm: number) {
        vehicleConfigs[this.vehicleType].maxSuspensionTravelCm = maxSuspensionTravelCm
        this.updateWheelsSuspension()
    }

    getMaxSuspensionTravelCm() {
        return vehicleConfigs[this.vehicleType].maxSuspensionTravelCm
    }

    setMaxSuspensionForce(maxSuspensionForce: number) {
        vehicleConfigs[this.vehicleType].maxSuspensionForce = maxSuspensionForce
        this.updateWheelsSuspension()
    }

    getMaxSuspensionForce() {
        return vehicleConfigs[this.vehicleType].maxSuspensionForce
    }

    setFrictionSlip(frictionSlip: number) {
        vehicleConfigs[this.vehicleType].frictionSlip = frictionSlip
        this.updateWheelsSuspension()
    }

    getFrictionSlip() {
        return vehicleConfigs[this.vehicleType].frictionSlip
    }

    setRollInfluence(rollInfluence: number) {
        vehicleConfigs[this.vehicleType].rollInfluence = rollInfluence
        this.updateWheelsSuspension()
    }

    getRollInfluence() {
        return vehicleConfigs[this.vehicleType].rollInfluence
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

        const inertia = this.getAmmoInertia()
        this.chassisMesh.body.ammo.getCollisionShape().calculateLocalInertia(mass, inertia)

        this.vehicle.getRigidBody().setMassProps(this.mass, inertia)
    }

    updateBreakingForce(breakingForce: number) {
        this.breakingForce = breakingForce
    }

}