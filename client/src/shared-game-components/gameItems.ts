const structureBounciness = 0.2

interface IGameItem {
    collisionFlags: number,
    shape: "convex" | "concave" | "box",
    receiveShadow?: boolean,
    notAddPhysics?: boolean,
    castsShadow?: boolean,
    /** see enable3d bounciness  */
    bounciness?: number
    isCourseObject?: boolean
    exactMatch?: boolean
    objectName?: string
    /** for debug */
    notVisible?: boolean
}
export const gameItems = {
    "ground": {
        collisionFlags: 1,
        shape: "concave",
        receiveShadow: true,
        bounciness: .05
    },
    "road": {
        collisionFlags: 1,
        shape: "convex",
        notAddPhysics: true,
        receiveShadow: true,
        bounciness: .1
    },
    "checkered-flag": {
        collisionFlags: 1,
        shape: "convex"
    },
    "checkpoint": {
        collisionFlags: 5,
        shape: "convex",
        isCourseObject: true,
        exactMatch: true,
        castsShadow: true,
        receiveShadow: true,
        objectName: "checkpoint"
    },
    "goal": {
        collisionFlags: 5,
        shape: "convex",
        isCourseObject: true,
        exactMatch: true,
        objectName: "goal",
        castsShadow: true,
        receiveShadow: true,
    },
    "tree": {
        collisionFlags: 1,
        shape: "concave",
        castsShadow: true,

    },
    "pine": {
        collisionFlags: 1,
        shape: "concave",
        castsShadow: true,

    },
    "leaf": {
        collisionFlags: 1,
        shape: "concave",
        castsShadow: true,
    },
    "checkpoint-spawn": {
        collisionFlags: -1,
        shape: "concave",
        notAddPhysics: true,
        isCourseObject: true,
        exactMatch: true,
        objectName: "checkpointSpawn"
    },
    "goal-spawn": {
        collisionFlags: -1,
        shape: "concave",
        notAddPhysics: true,
        isCourseObject: true,
        exactMatch: true,
        objectName: "goalSpawn"
    },
    "bridge": {
        collisionFlags: 1,
        shape: "concave"
    },
    "pavement-marking": {
        collisionFlags: 5,
        shape: "concave",
        receiveShadow: true
    },
    "fence": {
        collisionFlags: 1,
        shape: "convex",
        castsShadow: true,
        bounciness: structureBounciness,


    },
    "wall": {
        collisionFlags: 1,
        shape: "concave",
        castsShadow: true,
        bounciness: structureBounciness
    },
    "rock": {
        collisionFlags: 1,
        shape: "convex",
        bounciness: structureBounciness,
        castsShadow: true,
    },
    "barn": {
        collisionFlags: 1,
        shape: "concave",
        bounciness: structureBounciness,
        castsShadow: true,
        receiveShadow: true
    },
    "house": {
        collisionFlags: 1,
        shape: "concave",
        bounciness: structureBounciness,
        castsShadow: true,
        receiveShadow: true
    }

} as { [key: string]: IGameItem }