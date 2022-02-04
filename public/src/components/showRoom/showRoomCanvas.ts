import { ExtendedObject3D } from "enable3d"
import { AmbientLight, Color, MeshStandardMaterial, PerspectiveCamera, PointLight, Scene, sRGBEncoding, WebGLRenderer } from "three"
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { vehicleColors, VehicleType } from "../../shared-backend/shared-stuff"
import { getDeviceType, getStaticPath } from "../../utils/settings"
import { loadLowPolyVehicleModels } from "../../vehicles/LowPolyVehicle"
import { loadSphereModel } from "../../vehicles/SphereVehicle"
import { ItemProperties, ItemType } from "../../shared-backend/vehicleItems"
import { VehicleSetup } from "../../vehicles/VehicleSetup"

let currentVehicleType: VehicleType | undefined
let currentChassis: ExtendedObject3D | undefined

const addVehicle = (vehicleType: VehicleType, chassisNum: number, scene: Scene, vehicleColor?: string) => {


    if (vehicleType === "simpleSphere") {
        loadSphereModel(vehicleType, true).then((chassis) => {
            currentVehicleType = vehicleType
            currentChassis = chassis
            if (vehicleColor) {
                (chassis.material as MeshStandardMaterial).color = new Color(vehicleColor);

            } else {
                (chassis.material as MeshStandardMaterial).color = new Color(vehicleColors[chassisNum % vehicleColors.length].value);
            }
            scene.add(chassis)


        })
    } else {
        loadLowPolyVehicleModels(vehicleType, true).then(([tires, chassis]) => {
            currentVehicleType = vehicleType
            currentChassis = chassis
            if (vehicleColor) {
                (chassis.material as MeshStandardMaterial).color = new Color(vehicleColor);

            } else {
                (chassis.material as MeshStandardMaterial).color = new Color(vehicleColors[chassisNum % vehicleColors.length].value);
            }
            scene.add(chassis)

            for (let tire of tires) {
                scene.add(tire)
                tire.castShadow = tire.receiveShadow = true
            }
            //scene.add(tires[0])
        })
    }
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

export const changeChassisColor = (vehicleColor: string) => {
    // only color changed
    if (currentChassis) {

        (currentChassis.material as MeshStandardMaterial).color = new Color(vehicleColor)
    }
}

const loader = new GLTFLoader()
const addItem = (itemPath: string): Promise<ExtendedObject3D> => {
    return new Promise<ExtendedObject3D>((resolve, reject) => {

        loader.load(getStaticPath(`models/${currentVehicleType}/${itemPath}.glb`), (gltf: GLTF) => {
            console.log("item path", itemPath)
            for (let child of gltf.scene.children) {
                if (child.type === "Mesh") {
                    console.log("CHILD", child)
                    // child.position.set(child.position.x, child.position.y + this.vehicleConfig.centerOfMassOffset, child.position.z)
                    currentChassis.add(child)
                    resolve(child as ExtendedObject3D)
                }
            }
        })
    })
}


type CurrentItemProps = {

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

export const changeVehicleSetup = (vehicleSetup: VehicleSetup) => {
    if (!currentChassis) return

    let possibleItems = ["exhaust", "spoiler", "wheelGuards"]
    console.log("current items", currentItems)
    for (let item of possibleItems) {
        console.log("vehicleSetup[item]", vehicleSetup[item])
        if (vehicleSetup[item] !== currentItems[item]?.props) {
            if (currentItems[item]?.model) {
                console.log("removing item")
                currentChassis.remove(currentItems[item].model)
            }
            if (vehicleSetup[item]) {
                addItem(vehicleSetup[item].path).then(model => {

                    currentItems[item] = { props: vehicleSetup[item], model }
                })
            } else {
                currentItems[item] = undefined
            }
        }
    }
}


let renderer: WebGLRenderer | undefined, scene: Scene | undefined, camera: undefined | PerspectiveCamera


export const createShowRoomCanvas = (vehicleType: VehicleType, chassisNum: number, vehicleColor?: string, vehicleSetup?: VehicleSetup, _height?: number) => {
    currentVehicleType = vehicleType
    currentItems = {
        exhaust: undefined,
        spoiler: undefined,
        wheelGuards: undefined
    }
    if (scene && renderer) {
        scene.clear()
        addVehicle(vehicleType, chassisNum, scene, vehicleColor)
        addLights(scene)
        return undefined
    }

    const height = _height ?? 400
    const width = getDeviceType() === "desktop" ? window.innerWidth : screen.availWidth

    renderer = new WebGLRenderer({ antialias: true });

    console.log("domElement", renderer.domElement)

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


    addVehicle(vehicleType, chassisNum, scene, vehicleColor)




    window.onresize = function () {
        return

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    };

    camera.fov = 25

    let ry = 0

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

        if (!mousedown) {

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
let mousedown = false
const handleMouse = () => {
    mousedown = true // !mousedown
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