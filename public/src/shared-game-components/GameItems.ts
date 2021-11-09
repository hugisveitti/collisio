const structureBounciness = 0.2

interface IGameItem {
    collisionFlags: number,
    shape: "convex" | "concave" | "box",
    receiveShadow?: boolean,
    notAddPhysics?: boolean,
    castsShadow?: boolean,
    /** see enable3d bounciness  */
    bounciness?: number
    friction?: number
    isCourseObject?: boolean
    exactMatch?: boolean
    objectName?: string
    /** for debug */
    notVisible?: boolean
    mass?: number
    gravityY?: number
}
export const gameItems = {
    "ground": {
        collisionFlags: 1,
        shape: "concave",
        receiveShadow: true,
        bounciness: .05,
        isCourseObject: true,
        objectName: "ground",
        friction: 3.0
    },
    "road": {
        collisionFlags: 1,
        shape: "concave",
        // notAddPhysics: true,
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
        castsShadow: false,
        receiveShadow: true,
        objectName: "checkpoint"
    },
    "goal": {
        collisionFlags: 5,
        shape: "convex",
        isCourseObject: true,
        exactMatch: true,
        objectName: "goal",
        castsShadow: false,
        receiveShadow: true,
    },
    "tree": {
        collisionFlags: 1,
        shape: "concave",
        castsShadow: false,

    },
    "pine": {
        collisionFlags: 1,
        shape: "concave",
        castsShadow: false,

    },
    "leaf": {
        collisionFlags: 1,
        shape: "concave",
        castsShadow: false,
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
        castsShadow: false,
        bounciness: structureBounciness,
    },
    "wall": {
        collisionFlags: 1,
        shape: "concave",
        castsShadow: false,
        bounciness: structureBounciness
    },
    "rock": {
        collisionFlags: 1,
        shape: "convex",
        bounciness: structureBounciness,
        castsShadow: false,
    },
    "barn": {
        collisionFlags: 1,
        shape: "concave",
        bounciness: structureBounciness,
        castsShadow: false,
        receiveShadow: true
    },
    "house": {
        collisionFlags: 1,
        shape: "concave",
        bounciness: structureBounciness,
        castsShadow: false, /**this should be precalculated */
        receiveShadow: true
    },
    "traffic-cone": {
        // collisionFlag:0, cannot have convex shape (I think)
        collisionFlags: 0,
        shape: "convex",
        bounciness: .5,
        castsShadow: true,
        receiveShadow: false,
        mass: 2,
        notAddPhysics: false,
        gravityY: -50
    }

} as { [key: string]: IGameItem }