//import * as THREE from "three"
import * as THREE from "@enable3d/three-wrapper/dist/index"
import { loadLowPolyVehicleModels, } from "../../vehicles/LowPolyVehicle"
import { getDeviceType } from "../../utils/settings"
import { VehicleType } from "../../shared-backend/shared-stuff"
import { MeshStandardMaterial } from "three"
import { possibleVehicleColors } from "../../vehicles/VehicleConfigs"

const addVehicle = (vehicleType: VehicleType, chassisNum: number, scene: THREE.Scene) => {
    loadLowPolyVehicleModels(vehicleType, (tires, chassises) => {
        // const prePos = chassises[0].position;


        //  chassises[0].position.set(prePos.x, prePos.y, prePos.z);

        (chassises[0].material as THREE.MeshStandardMaterial).color = new THREE.Color(possibleVehicleColors[chassisNum % possibleVehicleColors.length]);
        scene.add(chassises[0])

        for (let tire of tires) {
            const { x, y, z } = tire.position

            //  tire.position.set(x + prePos.x, y + prePos.y, z+  prePos.z)
            scene.add(tire)

            tire.castShadow = tire.receiveShadow = true
        }
        scene.add(tires[0])
    }, true)
}

const addLights = (scene: THREE.Scene) => {

    const pLigth = new THREE.PointLight(0xffffff, 1, 10, 0)
    pLigth.castShadow = true
    pLigth.shadow.bias = 0.01
    pLigth.position.set(5, 5, 5)
    scene.add(pLigth)

    const aLigth = new THREE.AmbientLight(0xffffff, 0.3,)

    aLigth.position.set(5, 5, 5)
    scene.add(aLigth)
}


let renderer: THREE.WebGLRenderer | undefined, scene: THREE.Scene | undefined


export const createShowRoomCanvas = (vehicleType: VehicleType, chassisNum: number) => {
    if (scene && renderer) {
        scene.clear()
        addVehicle(vehicleType, chassisNum, scene)
        addLights(scene)
        return undefined
    }

    const height = 400
    const width = getDeviceType() === "desktop" ? window.innerWidth : screen.availWidth

    renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.outputEncoding = THREE.sRGBEncoding;
    console.log("width ", width)

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfe3dd);
    //  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    addLights(scene)

    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 100);
    camera.position.set(10, 5, -15);
    camera.aspect = width / height


    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.5, 0);
    controls.update();
    controls.enablePan = false;
    controls.enableDamping = true;


    addVehicle(vehicleType, chassisNum, scene)



    window.onresize = function () {
        return

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    };

    const animate = () => {

        requestAnimationFrame(animate);


        controls.update();
        if (renderer) {

            renderer.render(scene, camera);
        }

    }

    animate()
    // controls.addEventListener('change', () => {
    //     console.log("change")
    //     animate()
    // });

    return renderer
}

export const removeShowRoomCanvas = () => {
    renderer.clear()
    scene.clear()
    scene = undefined
    renderer = undefined
}