import { AmbientLight, Fog, Vector3, BackSide, Mesh, Color, SphereGeometry, ShaderMaterial, HemisphereLight, MeshStandardMaterial, PerspectiveCamera, PointLight, Scene, sRGBEncoding, WebGLRenderer } from "three"
import { vehicleColors, VehicleType } from "../../shared-backend/shared-stuff"
import { getDeviceType, getStaticPath } from "../../utils/settings"
/** class that TrafficSchoolCourse and RaceCourse extend */
import ExtendedObject3D from "@enable3d/common/dist/extendedObject3D";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { courseManager } from "../../course/loadingManager";
import { getTimeOfDayColors } from "../../classes/Game";
import { skydomeFragmentShader, skydomeVertexShader } from "../../game/shaders";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import "./backdrop.css"


let renderer: WebGLRenderer | undefined, scene: Scene | undefined, camera: PerspectiveCamera | undefined
let posX = 0, posZ = 0, posY = 0
const cameraMoveSpeed = 0.2
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
    // if (this.useShadows && this.timeOfDay === "day") {
    //     this.pLight.castShadow = true
    //     this.pLight.shadow.bias = 0.01
    // }

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
    console.log("change cam pos", posNum)
    // if (cameraPositions.length < posNum + 1) {
    //     console.warn("Invalid camera position number")
    //     return
    // }

    if (camera) {

        const pos = cameraPositions[posNum % cameraPositions.length]
        console.log("new pos", pos)
        //  camera.position.set(pos.x, pos.y, pos.z)
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

export const createBackdropRenderer = (loaderProgressCallback: (completed: number) => void) => {

    if (renderer) {
        renderer.setSize(window.innerWidth, window.innerHeight);
        return { renderer, alreadyExisted: true }
    }


    let width = window.innerWidth
    let height = window.innerHeight

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
        console.log("cameraPositions", cameraPositions)
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



    window.onresize = function () {
        width = window.innerWidth
        height = window.innerHeight
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    };


    let offset = 15
    let yOff = 0
    let dy = 0.005
    const yOffMax = Math.PI / 5
    //  camera.rotateY(ry)
    camera.fov = 30
    camera.updateProjectionMatrix()

    console.log("posx", posX, posZ)

    const animate = () => {

        requestAnimationFrame(animate);


        // controls.update();
        if (renderer) {
            renderer.render(scene, camera);
        }

        // camera.rotateY(ry)
        if (reachedTarget) {
            yOff += dy
            if (Math.abs(yOff) > yOffMax) {
                dy = - dy
            }

            camera.position.setX(posX + Math.sin(yOff))
            camera.position.setZ(posZ + Math.sin(yOff))
            camera.position.setY(posY + Math.sin(yOff))
        } else {
            const newPos = camera.position.clone().sub(camera.position.clone().sub(cameraTargetPos).multiplyScalar(cameraMoveSpeed))
            camera.position.set(newPos.x, newPos.y, newPos.z)

            if (newPos.distanceTo(cameraTargetPos) < 0.1) {
                reachedTarget = true
                yOff = 0

                //   camera.position.set(cameraTargetPos.x + Math.cos(yOff), cameraTargetPos.y, cameraTargetPos.z + Math.sin(yOff))
                setPosXZ()
            }

        }
        camera.lookAt(cameraLookAtPos.clone())
    }

    animate()
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
                console.log("completed", completed)

                loaderProgressCallback(completed)
            }
        }).then(gltf => {
            scene.add(gltf.scene)
            for (let child of gltf.scene.children) {
                if (child.name === "f1-car") {
                    console.log("f1 car", child)
                    lookAtPos = child.position
                } else if (child.name.includes("position")) {
                    const posNum = +child.name.slice(8)
                    console.log("pos nUm", posNum)
                    positions[posNum] = child.position
                    cameraPos = child.position
                    child.visible = false
                }
            }
            resolve([positions, lookAtPos])
        })
    })
}

export const removeShowRoomCanvas = () => {
    renderer.clear()
    scene.clear()
    scene = undefined
    renderer = undefined
}