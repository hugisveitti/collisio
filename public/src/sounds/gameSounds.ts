import { AudioLoader, Audio, AudioListener } from "three";
import { getStaticPath } from "../utils/settings";


const audioLoader = new AudioLoader();


let engineBuffer: AudioBuffer

export const loadEngineSoundBuffer = (callback: (_eb: AudioBuffer) => void) => {

    audioLoader.load(getStaticPath("sound/engine.mp3"), (buffer: AudioBuffer) => {

        engineBuffer = buffer
        callback(engineBuffer)

    })

}

export const getBeep = async (path: string, listener: AudioListener, callback: (beep: Audio) => void) => {
    audioLoader.load(path, (buffer: AudioBuffer) => {
        const sound = new Audio(listener)
        sound.setBuffer(buffer)
        sound.setLoop(false)
        sound.setVolume(0.5)
        callback(sound)
    })
}