import { SimpleVector } from "../models/IVehicle";

export interface ICourse {
    checkIfObjectOutOfBounds: (object: SimpleVector) => boolean
}