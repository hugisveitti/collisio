import { SimpleVector } from "../vehicles/IVehicle";

export interface ICourse {
    checkIfObjectOutOfBounds: (object: SimpleVector) => boolean
}