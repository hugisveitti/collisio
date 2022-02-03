import { ExtendedObject3D } from "enable3d"
import { AmbientLight, Color, MeshStandardMaterial, PerspectiveCamera, PointLight, Scene, sRGBEncoding, WebGLRenderer } from "three"
import { vehicleColors, VehicleType } from "../../shared-backend/shared-stuff"
import { getDeviceType } from "../../utils/settings"
import { loadLowPolyVehicleModels } from "../../vehicles/LowPolyVehicle"
import { loadSphereModel } from "../../vehicles/SphereVehicle"

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

let renderer: WebGLRenderer | undefined, scene: Scene | undefined, camera: undefined | PerspectiveCamera


export const createShowRoomCanvas = (vehicleType: VehicleType, chassisNum: number, vehicleColor?: string, _height?: number) => {
    if (scene && renderer) {
        scene.clear()
        addVehicle(vehicleType, chassisNum, scene, vehicleColor)
        addLights(scene)
        return undefined
    }

    const height = _height ?? 400
    const width = getDeviceType() === "desktop" ? window.innerWidth : screen.availWidth

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


    // const controls = new OrbitControls(camera, renderer.domElement);
    // controls.target.set(0, 0.5, 0);
    // controls.update();
    // controls.enablePan = false;
    // controls.enableDamping = true;

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
        ry += .01 * 3
        // camera.rotateY(ry)
        camera.position.setX(Math.cos(ry) * offset)
        camera.position.setZ(Math.sin(ry) * offset)
        camera.lookAt(0, 0, 0)

        animateTimeout = setTimeout(() => {

            requestAnimationFrame(animate);

        }, 1000 / targetFPS)
    }
    animate()
    // controls.addEventListener('change', () => {
    // 
    //     animate()
    // });

    return renderer
}

export const setShowRoomOffset = (_offset: number, y: number) => {
    offset = _offset

    camera.position.set(offset, y, offset);
}

export const removeShowRoomCanvas = () => {
    clearTimeout(animateTimeout)
    renderer.clear()
    scene.clear()
    scene = undefined
    renderer = undefined
    camera = undefined
}