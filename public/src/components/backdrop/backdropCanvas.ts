import { AmbientLight, BackSide, Color, Fog, HemisphereLight, Mesh, PerspectiveCamera, PointLight, Scene, ShaderMaterial, SphereGeometry, sRGBEncoding, Vector3, WebGLRenderer } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { getTimeOfDayColors } from "../../classes/Game";
import { skydomeFragmentShader, skydomeVertexShader } from "../../game/shaders";
import { getStaticPath } from "../../utils/settings";
import "./backdrop.css";


let renderer: WebGLRenderer | undefined, scene: Scene | undefined, camera: PerspectiveCamera | undefined
let posX = 0, posZ = 0, posY = 0
let cosOff = Math.PI / 2
let sinOff = 0
const cameraMoveSpeed = 0.4
const addLights = (scene: Scene) => {
    const timeOfDay = "day"

    const { ambientLightColor,
        hemisphereTopColor,
        hemisphereBottomColor,
        pointLightIntesity,
        ambientLightIntesity
    } = getTimeOfDayColors(timeOfDay)

    // this.pLight = new PointLight(0xffffff, 1, 0, 1)
    // maybe if evening then dont show shadows?
    const pLight = new PointLight(0xffffff, pointLightIntesity, 0, 1)
    pLight.position.set(100, 150, 100);

    scene.add(pLight)


    const hLight = new HemisphereLight(hemisphereTopColor, 1)
    hLight.position.set(0, 1, 0);
    hLight.color.setHSL(0.6, 1, 0.4);
    scene.add(hLight)

    const aLight = new AmbientLight(ambientLightColor, ambientLightIntesity)
    aLight.position.set(0, 0, 0)
    scene.add(aLight)

    const uniforms = {
        "topColor": { value: new Color(hemisphereTopColor) },
        "bottomColor": { value: new Color(hemisphereBottomColor) },
        "offset": { value: 33 },
        "exponent": { value: 0.6 }
    };

    uniforms["topColor"].value.copy(hLight.color);
    scene.background = new Color().setHSL(0.6, 0, 1);
    scene.fog = new Fog(scene.background, 1, 5000);
    scene.fog.color.copy(uniforms["bottomColor"].value);

    //  const trackInfo = getTrackInfo(this.getTrackName())

    const hemisphereRadius = 1000

    const skyGeo = new SphereGeometry(hemisphereRadius, 32, 15);
    const skyMat = new ShaderMaterial({
        uniforms: uniforms,
        vertexShader: skydomeVertexShader,
        fragmentShader: skydomeFragmentShader,
        side: BackSide
    });

    // move the sky?
    const sky = new Mesh(skyGeo, skyMat);

    scene.add(sky);
}


let cameraPositions = []
let cameraTargetPos = new Vector3(0, 0, 0);
let reachedTarget = true;

export const changeCameraPosition = (posNum: number) => {


    if (camera) {

        const pos = cameraPositions[posNum % cameraPositions.length]
        cameraTargetPos = pos
        reachedTarget = false
        setPosXZ()
    }
}

const setPosXZ = () => {
    console.log("cam", camera)
    posX = camera.position.x
    posZ = camera.position.z
    posY = camera.position.y
}

let animateTimeout: NodeJS.Timeout

let width = window.innerWidth
let height = window.innerHeight
export const createBackdropRenderer = (loaderProgressCallback: (completed: number) => void) => {

    if (renderer) {

        return { renderer, alreadyExisted: true }
    }



    renderer = new WebGLRenderer({ antialias: true });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.outputEncoding = sRGBEncoding;
    renderer.domElement.setAttribute("id", "back-drop-canvas")
    renderer.domElement.setAttribute("style", `width: ${window.innerWidth}, height:${window.innerHeight}`)

    scene = new Scene();
    let cameraLookAtPos = new Vector3(-37, 1, 67)
    let cameraPos = new Vector3(0, 1, 0)

    addLights(scene)
    loadScene(scene, loaderProgressCallback).then(([_cameraPositions, lookAtPos]) => {
        cameraLookAtPos = lookAtPos
        cameraPositions = _cameraPositions
        cameraPos = cameraPositions[0]
        camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z)
        camera.lookAt(cameraLookAtPos)
        setPosXZ()
    })


    camera = new PerspectiveCamera(40, width / height, 1, 2000);
    // camera.position.set(25, 9, 6);
    camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z)

    //  camera.aspect = width/ height


    camera.lookAt(cameraLookAtPos.clone())

    // const controls = new OrbitControls(camera, renderer.domElement);
    // controls.target.set(0, 0.5, 0);
    // controls.update();
    // controls.enablePan = false;
    // controls.enableDamping = true;




    // window.onresize = function () {
    //     // remove func
    //     width = window.innerWidth
    //     height = window.innerHeight
    //     camera.aspect = width / height;
    //     camera.updateProjectionMatrix();
    //     renderer.setSize(width, height);
    // };
    window.addEventListener("resize", handleWindowResize)
    window.setTimeout(() => {
        width = window.innerWidth
        height = window.innerHeight
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        //  handleWindowResize()
    }, 500)



    let dSin = 0.005
    let dCos = 0.003

    const sinOffMax = Math.PI / 4
    const cosOffMax = Math.PI
    //  camera.rotateY(ry)
    let fov = width < 600 ? 60 : 30
    camera.fov = fov

    camera.updateProjectionMatrix()


    let time = Date.now()
    const targetFPS = 20

    const animate = () => {



        // controls.update();
        if (renderer) {
            const now = Date.now()
            const delta = now - time

            renderer.render(scene, camera);
            time = now

        }

        // camera.rotateY(ry)
        if (reachedTarget) {
            sinOff += dSin
            if (Math.abs(sinOff) > sinOffMax) {
                dSin = -dSin
            }

            cosOff += dCos
            if (Math.abs(cosOff) > cosOffMax) {
                dCos = -dCos
            }

            camera.position.setX(posX + Math.sin(sinOff) + Math.cos(cosOff))
            camera.position.setZ(posZ + Math.sin(sinOff) + Math.cos(cosOff))
            camera.position.setY(posY + Math.sin(sinOff) + Math.cos(cosOff))
        } else {
            const newPos = camera.position.clone().sub(camera.position.clone().sub(cameraTargetPos).multiplyScalar(cameraMoveSpeed))
            camera.position.set(newPos.x, newPos.y, newPos.z)

            if (newPos.distanceTo(cameraTargetPos) < 0.1) {
                reachedTarget = true
                sinOff = 0
                cosOff = Math.PI / 2
                //   camera.position.set(cameraTargetPos.x + Math.cos(yOff), cameraTargetPos.y, cameraTargetPos.z + Math.sin(yOff))
                setPosXZ()
            }

        }
        camera.lookAt(cameraLookAtPos.clone())

        animateTimeout = setTimeout(() => {

            requestAnimationFrame(animate);

        }, 1000 / targetFPS)
    }

    if (
        sinOff === 0 &&

        cosOff === Math.PI / 2) {
        console.log("Calling animate")
        animate()
    } else {
        console.warn("!!! Trying to animate backdrop canvas twice")
    }
    return { renderer, alreadyExisted: false }
}

const loadScene = async (scene: Scene, loaderProgressCallback: (completed: number) => void) => {
    const loader = new GLTFLoader()
    return new Promise<[Vector3[], Vector3]>(async (resolve, reject) => {
        let lookAtPos = new Vector3(0, 0, 0)
        let cameraPos = new Vector3(0, 0, 0)
        let positions: Vector3[] = []
        let c = 0

        loader.loadAsync(getStaticPath("models/front-page.glb"), (e) => {
            if (e.lengthComputable) {
                const completed = e.loaded / e.total
                loaderProgressCallback(completed)
                // if(completed === 1){
                //     delete loaderProgressCallback
                // }
            }
        }).then(gltf => {
            scene.add(gltf.scene)
            for (let child of gltf.scene.children) {
                if (child.name === "f1-car") {
                    lookAtPos = child.position
                } else if (child.name.includes("position")) {
                    const posNum = +child.name.slice(8)
                    positions[posNum] = child.position
                    cameraPos = child.position
                    child.visible = false
                }
            }
            resolve([positions, lookAtPos])
        })
    })
}

const handleWindowResize = () => {
    width = window.innerWidth
    height = window.innerHeight
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

export const clearBackdropCanvas = () => {
    console.log("#########clearing backdrop canvas#####")
    if (animateTimeout) {
        clearTimeout(animateTimeout)
    }
    window.removeEventListener("resize", handleWindowResize)
    renderer?.clear()
    scene?.clear()
    scene = undefined
    renderer = undefined
    cosOff = Math.PI / 2
    sinOff = 0

}