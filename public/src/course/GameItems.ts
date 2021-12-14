const structureBounciness = 0.05
const treeBounciness = 0.1

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

    /** for stuff that is in arrays such as coin-points */
    isCourseObjectArray?: boolean
    /** for stuff in a key value storage, such as the spawn aligns */
    isCourseObjectDict?: boolean
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
        bounciness: .05
    },
    "checkered-flag": {
        collisionFlags: 1,
        shape: "convex"
    },
    "checkpoint": {
        collisionFlags: 5,
        shape: "convex",
        isCourseObject: true,
        // exactMatch: true,
        castsShadow: false,
        receiveShadow: true,
        objectName: "checkpoints",
        isCourseObjectArray: true
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
        bounciness: treeBounciness,
    },
    "pine": {
        collisionFlags: 1,
        shape: "concave",
        castsShadow: false,
        bounciness: treeBounciness
    },
    "leaf": {
        collisionFlags: 1,
        shape: "concave",
        castsShadow: false,
        bounciness: treeBounciness
    },
    "checkpoint-spawn": {
        collisionFlags: -1,
        shape: "concave",
        notAddPhysics: true,
        isCourseObject: true,
        // exactMatch: true,
        objectName: "checkpointSpawns",
        isCourseObjectArray: true
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
        shape: "concave",
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
    },
    "water": {
        collisionFlags: 5,
        shape: "concave",
    },
    "row-boat": {
        collisionFlags: 1,
        shape: "concave",
        bounciness: structureBounciness,
        castsShadow: false
    },
    "coin": {
        collisionFlags: 6,
        shape: "concave",
        isCourseObject: true,
        castsShadow: true,
        objectName: "coinModel",
        notAddPhysics: true,
        notVisible: true,
        exactMatch: true
    },
    /** possible places for coins to spawn */
    "coin-point": {
        collisionFlags: 6,
        shape: "concave",
        notAddPhysics: true,
        notVisible: true,
        isCourseObjectArray: true,
        objectName: "coinPoints"
    },
    "stadium": {
        collisionFlags: 1,
        shape: "concave"
    },

    "ramp": {
        collisionFlags: 1,
        shape: "concave",
        bounciness: 0
    },
    // goal spawn align
    "s-align": {
        collisionFlags: 1,
        shape: "concave",
        notAddPhysics: true,
        isCourseObject: true,
        objectName: "sAlign",
        notVisible: true,
    },
    "align": {
        collisionFlags: 1,
        shape: "concave",
        notAddPhysics: true,
        isCourseObjectDict: true,
        objectName: "spawnAligners",
        notVisible: true,
    },



} as { [key: string]: IGameItem }