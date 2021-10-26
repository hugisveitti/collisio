//import * as THREE from "three"
import * as THREE from "@enable3d/three-wrapper/dist/index"
import { loadLowPolyVehicleModels, LowPolyVehicle, VehicleType } from "../../models/LowPolyVehicle"
import { getDeviceType } from "../../utils/settings"




export const createShowRoomCanvas = (vehicleType: VehicleType, chassisNum: number) => {

    const height = 400
    const width = getDeviceType() === "desktop" ? window.innerWidth : screen.availWidth

    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.outputEncoding = THREE.sRGBEncoding;


    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfe3dd);
    //  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 100);
    camera.position.set(10, 5, -15);
    camera.aspect = width / height

    const pLigth = new THREE.PointLight(0xffffff, 1, 10, 0)
    pLigth.castShadow = true
    pLigth.shadow.bias = 0.01
    pLigth.position.set(5, 5, 5)
    scene.add(pLigth)

    const aLigth = new THREE.AmbientLight(0xffffff, 0.3,)

    aLigth.position.set(5, 5, 5)
    scene.add(aLigth)

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.5, 0);
    controls.update();
    controls.enablePan = false;
    controls.enableDamping = true;

    loadLowPolyVehicleModels(vehicleType, (tires, chassises) => {
        const prePos = chassises[0].position
        const ppx = prePos.x
        console.log("pre pos", prePos, ppx)
        const cI = Math.abs(chassisNum % chassises.length)
        chassises[cI].position.set(prePos.x, prePos.y, prePos.z)
        scene.add(chassises[cI])
        console.log("chassises[0]", chassises[cI])
        console.log("tires", tires)
        for (let tire of tires) {
            const { x, y, z } = tire.position

            // tire.position.set(x - prePos.x, y - prePos.y, z - prePos.z)
            scene.add(tire)

            tire.castShadow = tire.receiveShadow = true
        }
        scene.add(tires[0])
    }, true)


    window.onresize = function () {
        return

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    };
    const animate = () => {
        requestAnimationFrame(animate);

        controls.update();
        renderer.render(scene, camera);

    }

    animate()

    return renderer
}
