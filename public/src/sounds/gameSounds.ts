import { AudioLoader } from "three";
import { getStaticPath } from "../utils/settings";


const audioLoader = new AudioLoader();


let engineBuffer: AudioBuffer

export const loadEngineSoundBuffer = (callback: (_eb: AudioBuffer) => void) => {
    // if (engineBuffer) {


    //     callback(engineBuffer)
    // } else {

    audioLoader.load(getStaticPath("sound/engine.mp3"), (buffer: AudioBuffer) => {

        engineBuffer = buffer
        callback(engineBuffer)

    })
    // }
}