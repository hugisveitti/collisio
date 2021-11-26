import { Audio, AudioLoader } from "three";
import { getStaticPath } from "../utils/settings";


const audioLoader = new AudioLoader();


let engineBuffer: AudioBuffer

export const setEngineSound = (engineSound: Audio, volume: number, startPlaying: boolean) => {
    if (engineBuffer) {
        engineSound.setBuffer(engineBuffer)
        engineSound.setLoop(true)
        engineSound.setVolume(volume)


        engineSound.setLoopEnd(2.5)
        if (startPlaying) {
            engineSound.play()
        }
    } else {

        audioLoader.load(getStaticPath("sound/engine.mp3"), (buffer: AudioBuffer) => {
            //audioLoader.load(getStaticPath("sound/engine-test.mp3"), (buffer: AudioBuffer) => {
            engineSound.setBuffer(buffer)
            engineSound.setLoop(true)
            engineSound.setVolume(volume)


            engineSound.setLoopEnd(2.5)
            engineBuffer = buffer
            if (startPlaying) {
                engineSound.play()
            }
        })
    }
}