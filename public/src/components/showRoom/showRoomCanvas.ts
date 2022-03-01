import { ExtendedObject3D } from "enable3d";
import { AmbientLight, Color, PerspectiveCamera, PointLight, Scene, sRGBEncoding, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { VehicleColorType, VehicleType } from "../../shared-backend/shared-stuff";
import { ItemProperties, ItemType, possibleVehicleItemTypes, VehicleSetup } from "../../shared-backend/vehicleItems";
import { getDeviceType, getStaticPath } from "../../utils/settings";
import { loadLowPolyVehicleModels } from "../../vehicles/LowPolyVehicle";
import { loadSphereModel } from "../../vehicles/SphereVehicle";
import { changeVehicleBodyColor } from "../../vehicles/Vehicle";

let currentVehicleType: VehicleType | undefined
let currentChassis: ExtendedObject3D | undefined

const addVehicle = (vehicleType: VehicleType, chassisNum: number, scene: Scene, vehicleColor?: VehicleColorType) => {
    return new Promise<void>((resolve, reject) => {

        currentVehicleType = vehicleType

        if (vehicleType === "simpleSphere") {
            loadSphereModel(vehicleType, true).then((chassis) => {
                if (vehicleType !== currentVehicleType) {
                    console.warn("vehicle type changed after load",)
                    // if vehicle type changes before the load completes
                    return
                }
                currentChassis = chassis
                if (vehicleColor) {
                    // (chassis.material as MeshStandardMaterial).color = new Color(vehicleColor);
                    changeVehicleBodyColor(currentChassis, [vehicleColor])

                }
                scene.add(chassis)

                resolve()
            })
        } else {
            loadLowPolyVehicleModels(vehicleType, true).then(([tires, chassis]) => {
                if (vehicleType !== currentVehicleType) {
                    console.warn("vehicle type changed after load",)
                    return
                }
                currentChassis = chassis
                if (vehicleColor) {
                    changeVehicleBodyColor(currentChassis, [vehicleColor])
                }
                scene.add(chassis)

                for (let tire of tires) {
                    scene.add(tire)
                    tire.castShadow = tire.receiveShadow = true
                }

                resolve()
            })
        }
    })
}
let offset = 15
const addLights = (scene: Scene) => {

    const pLigth = new PointLight(0xffffff, 1, 10, 0)
    pLigth.castShadow = true
    pLigth.shadow.bias = 0.01
    pLigth.position.set(5, 5, 5)
    scene.add(pLigth)

    const aLigth = new AmbientLight(0xffffff, 0.3,)

    aLigth.position.set(5, 5, 5)
    scene.add(aLigth)
}
let animateTimeout: NodeJS.Timeout

export const changeChassisColor = (vehicleColor: VehicleColorType) => {
    // only color changed
    if (currentChassis) {
        changeVehicleBodyColor(currentChassis, [vehicleColor])
    }
}

const loader = new GLTFLoader()
const addItem = (itemPath: string): Promise<ExtendedObject3D> => {
    return new Promise<ExtendedObject3D>((resolve, reject) => {

        loader.load(getStaticPath(`models/${currentVehicleType}/${itemPath}.glb`), (gltf: GLTF) => {
            for (let child of gltf.scene.children) {
                if (child.type === "Mesh") {
                    // child.position.set(child.position.x, child.position.y + this.vehicleConfig.centerOfMassOffset, child.position.z)
                    currentChassis.add(child)
                    resolve(child as ExtendedObject3D)
                }
            }
        })
    })
}


export type CurrentItemProps = {
    [item in ItemType]: { model: ExtendedObject3D, props: ItemProperties }
}

let currentItems: CurrentItemProps = {
    exhaust: undefined,
    spoiler: undefined,
    wheelGuards: undefined
}

// let currentExhaust: { model: ExtendedObject3D, props: ItemProperties }
// let currentSpoiler: ItemProperties
// let currentWheelGuards: ItemProperties
let currentColor: string

export const changeVehicleSetup = async (vehicleSetup: VehicleSetup) => {
    console.log("changing vehicle setup", vehicleSetup)
    console.log("current items", currentItems)
    if (!currentChassis || !vehicleSetup) return

    for (let item of possibleVehicleItemTypes) {
        if (vehicleSetup[item] !== currentItems[item]?.props) {
            if (currentItems[item]?.model) {
                currentChassis.remove(currentItems[item].model)
            }
            if (vehicleSetup[item]) {
                const model = await addItem(vehicleSetup[item].path)
                if (vehicleSetup.vehicleType !== currentVehicleType) {
                    console.warn("vehicle type has changed", vehicleSetup.vehicleType, currentVehicleType)
                    return
                }
                currentItems[item] = { props: vehicleSetup[item], model }
            } else {
                currentItems[item] = undefined
            }
        }
    }
}


let renderer: WebGLRenderer | undefined, scene: Scene | undefined, camera: undefined | PerspectiveCamera

let ry = 0

const width = getDeviceType() === "desktop" ? window.innerWidth : screen.availWidth
export const setRendererHeight = (height: number) => {
    if (!renderer) return
    renderer.setSize(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
}

export const createShowRoomCanvas = (vehicleType: VehicleType, chassisNum: number, vehicleColor?: VehicleColorType, vehicleSetup?: VehicleSetup, _height?: number) => {
    currentVehicleType = vehicleType
    stopSpinCamera = false
    if (scene && renderer) {
        scene.clear()
        addVehicle(vehicleType, chassisNum, scene, vehicleColor)
        addLights(scene)
        return undefined
    }

    const height = _height ?? 400

    renderer = new WebGLRenderer({ antialias: true });


    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.outputEncoding = sRGBEncoding;

    scene = new Scene();
    scene.background = new Color(0xbfe3dd);
    //  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    addLights(scene)

    camera = new PerspectiveCamera(40, width / height, 1, 100);
    camera.position.set(10, 5, -15);
    camera.aspect = width / height


    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.5, 0);
    controls.update();
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.autoRotate = true

    camera.lookAt(0, 0, 0)


    addVehicle(vehicleType, chassisNum, scene, vehicleColor).then(() => {
        if (vehicleSetup) {
            changeVehicleSetup(vehicleSetup)
        }
    })


    window.onresize = function () {
        return

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    };

    camera.fov = 25



    camera.rotateY(ry)

    let time = Date.now()
    const targetFPS = 30
    controls.autoRotateSpeed = 60 / targetFPS * 2

    const animate = () => {

        // requestAnimationFrame(animate);


        // controls.update();
        if (renderer && camera) {

            renderer.render(scene, camera);
            const now = Date.now()
            const delta = now - time

            time = now
        } else if (renderer) {
            renderer.clear()
        }

        if (!stopSpinCamera && camera) {

            ry += .01 * 3
            // camera.rotateY(ry)
            camera.position.setX(Math.cos(ry) * offset)
            camera.position.setZ(Math.sin(ry) * offset)
            camera.lookAt(0, 0, 0)
        }

        animateTimeout = setTimeout(() => {

            requestAnimationFrame(animate);

        }, 1000 / targetFPS)
    }
    animate()

    // controls.addEventListener('change', () => {
    // 
    //     animate()
    // });

    renderer.domElement.addEventListener("mousedown", handleMouse)
    renderer.domElement.addEventListener("touchstart", handleMouse)

    return renderer
}
let stopSpinCamera = false
const handleMouse = (e: MouseEvent) => {
    e.preventDefault()
    stopSpinCamera = true // !mousedown
}

//window.addEventListener("mouseup", handleMouse)

export const setShowRoomOffset = (_offset: number, y: number) => {
    offset = _offset

    camera.position.set(offset, y, offset);
}

export const removeShowRoomCanvas = () => {
    renderer.domElement.removeEventListener("mousedown", handleMouse)
    clearTimeout(animateTimeout)
    renderer.clear()
    scene.clear()
    scene = undefined
    renderer = undefined
    camera = undefined
    //  window.removeEventListener("mouseup", handleMouse)
}