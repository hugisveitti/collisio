import { AmbientLight, Color, Object3D, PerspectiveCamera, PointLight, Scene, sRGBEncoding, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { getDeviceType, getStaticPath } from "../../utils/settings";


const loadTrophyModel = async (id: string): Promise<Object3D> => {
    return new Promise<Object3D>((resolve, reject) => {
        const loader = new GLTFLoader()


        loader.load(getStaticPath(`models/trophies/trophy${id}.glb`), (gltf: GLTF) => {

            let trophy: Object3D
            for (let child of gltf.scene.children) {

                if (child.name.includes("trophy")) {
                    trophy = child
                    break
                }
            }

            try {

                resolve(trophy)
            } catch (e) {
                console.warn("error resolving:", e)
            }
        })
    })
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


export const createTrophyRoomCanvas = async (id: string) => {

    if (scene && renderer) {
        scene.clear()

        const trophy = await loadTrophyModel(id)

        if (!trophy) {
            return undefined
        }
        scene.add(trophy)
        addLights(scene)
        return undefined
    }

    const height = window.innerHeight * 0.8
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


    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.5, 0);
    controls.update();
    controls.enablePan = false;
    controls.enableDamping = true;

    camera.lookAt(0, 0, 0)


    const trophy = await loadTrophyModel(id)

    if (!trophy) {
        return
    }
    scene.add(trophy)


    window.onresize = function () {
        return

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    };

    let ry = 0.01
    let offset = 15
    camera.rotateY(ry)
    const animate = () => {

        requestAnimationFrame(animate);


        controls.update();
        if (renderer) {

            renderer.render(scene, camera);
        }
        //  ry += .01
        trophy.rotateY(ry)
        // camera.rotateY(ry)
        // camera.position.setX(Math.cos(ry) * offset)
        // camera.position.setZ(Math.sin(ry) * offset)
        // camera.lookAt(0, 0, 0)
    }

    animate()
    // controls.addEventListener('change', () => {
    // 
    //     animate()
    // });

    return renderer
}

export const removeTrophyRoomCanvas = () => {
    renderer.clear()
    scene.clear()
    scene = undefined
    renderer = undefined
}