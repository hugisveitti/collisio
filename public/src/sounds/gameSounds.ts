import { Audio, AudioLoader } from "@enable3d/three-wrapper/dist";
import { getStaticPath } from "../utils/settings";


const audioLoader = new AudioLoader();


let engineBuffer: AudioBuffer

export const setEngineSound = (engineSound: Audio, volume: number) => {
    if (engineBuffer) {
        engineSound.setBuffer(engineBuffer)
        engineSound.setLoop(true)
        engineSound.setVolume(volume)
        engineSound.play()

        engineSound.setLoopEnd(2.5)
    } else {

        audioLoader.load(getStaticPath("sound/engine.mp3"), (buffer: AudioBuffer) => {
            engineSound.setBuffer(buffer)
            engineSound.setLoop(true)
            engineSound.setVolume(volume)
            engineSound.play()

            engineSound.setLoopEnd(2.5)
            engineBuffer = buffer
        })
    }
}