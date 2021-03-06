import ExtendedObject3D from "@enable3d/common/dist/extendedObject3D";
import { Object3D, PointLight, MeshStandardMaterial, Matrix3 } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { yellow2 } from "../providers/theme";
import { getStaticPath } from "../utils/settings";
import { Course } from "./Course";
import "./course.css";
import { gameItems, keyNameMatch } from "./GameItems";


let waterTextures: [THREE.Texture, THREE.Texture] | undefined


export class CourseItemsLoader {

    course: Course

    constructor(course: Course) {
        this.course = course
    }


    handleCreateLight(child: Object3D) {
        child.visible = false
        if (this.course.gameScene.gameSettings.graphics === "low") return
        if (!child.name.includes("ghost")) {
            let sDistance = child.name.split("_")[0]
            let distance = 100
            if (!isNaN(+sDistance)) {
                distance = +sDistance
            }
            const pLight = new PointLight(yellow2, 1, distance, 1)
            this.course.lights.push(pLight)

            const p = child.position
            pLight.position.set(p.x, p.y, p.z)
            if (this.course.gameScene.useShadows) {
                pLight.castShadow = true
                pLight.shadow.bias = 0.01
            }
            this.course.gameScene.add.existing(pLight)
        }
    }

    handleCreateWater(child: Object3D) {
        if (this.course.gameScene.gameSettings.graphics === "high") {
            const waterObject = child
            if (!waterTextures) {

                const texturesPromise = Promise.all([
                    this.course.gameScene.load.texture('/textures/Water_1_M_Normal.jpg'),
                    this.course.gameScene.load.texture('/textures/Water_2_M_Normal.jpg')
                ])
                texturesPromise.then(textures => {
                    textures[0].needsUpdate = false // true
                    textures[1].needsUpdate = false // true
                    waterTextures = textures
                    textures[0].matrixAutoUpdate = false
                    textures[1].matrixAutoUpdate = false

                    waterObject.visible = true
                    textures[0].rotation = Math.PI / 2
                    textures[1].rotation = Math.PI / 2
                    textures[1].flipY = false
                    textures[0].flipY = false
                    const ma = new Matrix3()
                    ma.set(1, 1, 1, 1, 1, 1, 1, 1, 1)
                    textures[0].matrix = ma
                    textures[0].updateMatrix()
                    textures[1].matrix = ma
                    textures[1].updateMatrix()

                    let size = Math.max(waterObject.scale.x * 2, waterObject.scale.z * 2)
                    size = Math.ceil(Math.log2(size))
                    size = 2 ** size
                    // WebGL: INVALID_OPERATION: generateMipmap: level 0 not power of 2 or not all the same size
                    this.course.gameScene.misc.water({
                        y: waterObject.position.y + .1,
                        x: waterObject.position.x,
                        z: waterObject.position.z,

                        width: size,
                        height: size,
                        // width: waterObject.scale.x * 2,
                        // height: waterObject.scale.z * 2,
                        normalMap0: textures[0],
                        normalMap1: textures[1],

                    })

                }).catch(err => {
                    console.warn("Error loading water texture", err)
                })
            } else {
                waterObject.visible = false
                this.course.gameScene.misc.water({
                    y: waterObject.position.y,
                    x: waterObject.position.x,
                    z: waterObject.position.z,


                    width: waterObject.scale.z * 2,
                    height: waterObject.scale.x * 2,
                    normalMap0: waterTextures[0],
                    normalMap1: waterTextures[1],
                })
            }
        } else {
            // simply add the water texture with no physics
        }
    }

    handleCreateBreakable(eObject: ExtendedObject3D, key: string) {
        console.warn("Creating breakable objects not supported yet")
        eObject.breakable = true
        let snum = eObject.name.split("_")[0]
        let num = gameItems[key].fractureImpulse ?? 5
        if (!isNaN(+snum)) {
            num = +snum
        }
        eObject.body.on.collision((o, e) => {
        })
        eObject.fractureImpulse = num
        eObject.body.setCollisionFlags(3)
        eObject.body.breakable = true
    }

    // if a number is before the name then that is its mass 
    static GetMassFromName(name: string): number | undefined {
        let split = name.split("-")
        return !isNaN(+split[0]) ? +split[0] : undefined
    }

    handleCreatePhysicsObject(child: Object3D, key: string) {
        const eObject = (child as ExtendedObject3D)

        let mass = CourseItemsLoader.GetMassFromName(child.name) ?? gameItems[key].mass


        this.course.gameScene.physics.add.existing(eObject, { collisionFlags: gameItems[key].collisionFlags, shape: gameItems[key].shape, mass });
        eObject.castShadow = this.course.gameScene.useShadows && Boolean(gameItems[key].castsShadow);
        eObject.receiveShadow = this.course.gameScene.useShadows && Boolean(gameItems[key].receiveShadow);

        //  eObject.body.setGravity(0, -5, 0)

        //  eObject.visible = !Boolean(gameItems[key].notVisible);
        eObject.body.checkCollisions = true
        if (gameItems[key].bounciness) {
            eObject.body.setBounciness(gameItems[key].bounciness)
        }
        if (gameItems[key].friction) {
            eObject.body.setFriction(gameItems[key].friction)
        }
        if (gameItems[key].gravityY) {
            eObject.body.setGravity(0, gameItems[key].gravityY, 0)
        }
        if (child.name.includes("hidden")) {
            child.visible = false
        }
        if (child.name.includes("breakable")) {
            this.handleCreateBreakable(eObject, key)
        }

        this.course.gamePhysicsObjects.push(eObject)
    }

    handleAddCourseObject(child: Object3D, key: string) {
        // hacky ????
        if (!gameItems[key].objectName) {
            console.warn(`Object with key '${key}' is course object but doesn't have an object name`)
        }
        if (gameItems[key].isCourseObjectArray) {
            const code = `this.course.${gameItems[key].objectName}.push(child)`
            eval(code)
        } else if (gameItems[key].isCourseObjectDict) {
            const code = `this.course.${gameItems[key].objectName}["${child.name}"] = child`
            eval(code)
        } else {
            const code = `this.course.${gameItems[key].objectName} = child`
            eval(code)

        }
    }


    loadGameItemsToCourse(gltf: GLTF) {
        const itemKeys = Object.keys(gameItems)

        /* items named hidden-X in blender, will have physics but will be invisible
        *  items named ghost-X in blender won't have physics but will be visible
        *  using this we have have complex multi poly sturctures that are difficult to render like fences or tree
        *  but then render a box in their place for the physics
        */
        for (let child of gltf.scene.children) {

            if (child.name.includes("_light")) {
                this.handleCreateLight(child)
            } else if (child.type === "Mesh" || child.type === "Group") {
                if (child.name.includes("rotate")) {
                    const num = !isNaN(+child.name.split("_")[0]) ? Math.PI / +child.name.split("_")[0] : Math.PI / 120
                    this.course.rotatingObjects.push({ object: child, speed: num })
                }

                if (child.name.includes("ghost")) {
                } else if (child.name.includes("softbody")) {
                    console.warn("soft body doesnt work")
                }
                else {
                    for (let key of itemKeys) {
                        if (keyNameMatch(key, child.name)) {
                            child.layers.enable(1)

                            child.visible = !Boolean(gameItems[key].notVisible);
                            if (!Boolean(gameItems[key].notAddPhysics)) {
                                this.handleCreatePhysicsObject(child, key)
                            }
                            if (child.name.includes("water")) {
                                this.handleCreateWater(child)
                            }
                            if (gameItems[key].isCourseObject || gameItems[key].isCourseObjectArray || gameItems[key].isCourseObjectDict) {
                                this.handleAddCourseObject(child, key)
                            }
                        }
                    }
                    if (child.name.includes("spawn") && !child.name.includes("align")) {
                        this.course.spawns.push(child)
                        child.visible = false
                    }
                }
            }
        }
    }
}


export const notSeeThroughObjects = [
    "spawn",
    "align",
    "crops",
    "scarecrow",
    "field",
    "sheep",
    "water"
]


export const loadPowerbox = () => {
    return new Promise<ExtendedObject3D>((resolve, reject) => {


        const loader = new GLTFLoader()
        loader.loadAsync(getStaticPath(`models/power-box.glb`)).then(gltf => {
            resolve(gltf.scene.children[0] as ExtendedObject3D)
            return
        })
    })
}