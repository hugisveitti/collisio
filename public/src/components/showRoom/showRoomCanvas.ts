import { Color, Scene, MeshStandardMaterial, PointLight, AmbientLight, WebGLRenderer, sRGBEncoding, PerspectiveCamera } from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { loadLowPolyVehicleModels, } from "../../vehicles/LowPolyVehicle"
import { getDeviceType } from "../../utils/settings"
import { VehicleType } from "../../shared-backend/shared-stuff"
import { possibleVehicleColors } from "../../vehicles/VehicleConfigs"

const addVehicle = (vehicleType: VehicleType, chassisNum: number, scene: Scene) => {
    loadLowPolyVehicleModels(vehicleType, (tires, chassises) => {
        // const prePos = chassises[0].position;


        //  chassises[0].position.set(prePos.x, prePos.y, prePos.z);

        (chassises[0].material as MeshStandardMaterial).color = new Color(possibleVehicleColors[chassisNum % possibleVehicleColors.length]);
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


let renderer: WebGLRenderer | undefined, scene: Scene | undefined


export const createShowRoomCanvas = (vehicleType: VehicleType, chassisNum: number) => {
    if (scene && renderer) {
        scene.clear()
        addVehicle(vehicleType, chassisNum, scene)
        addLights(scene)
        return undefined
    }

    const height = 400
    const width = getDeviceType() === "desktop" ? window.innerWidth : screen.availWidth

    renderer = new WebGLRenderer({ antialias: true });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.outputEncoding = sRGBEncoding;

    scene = new Scene();
    scene.background = new Color(0xbfe3dd);
    //  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    addLights(scene)

    const camera = new PerspectiveCamera(40, width / height, 1, 100);
    camera.position.set(10, 5, -15);
    camera.aspect = width / height


    // const controls = new OrbitControls(camera, renderer.domElement);
    // controls.target.set(0, 0.5, 0);
    // controls.update();
    // controls.enablePan = false;
    // controls.enableDamping = true;

    camera.lookAt(0, 0, 0)


    addVehicle(vehicleType, chassisNum, scene)



    window.onresize = function () {
        return

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    };

    let ry = 0
    let offset = 15
    camera.rotateY(ry)
    const animate = () => {

        requestAnimationFrame(animate);


        // controls.update();
        if (renderer) {

            renderer.render(scene, camera);
        }
        ry += .01
        // camera.rotateY(ry)
        camera.position.setX(Math.cos(ry) * offset)
        camera.position.setZ(Math.sin(ry) * offset)
        camera.lookAt(0, 0, 0)
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