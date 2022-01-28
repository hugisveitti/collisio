import { AudioLoader, Audio, AudioListener, PerspectiveCamera } from "three";
import { getDeviceType, getStaticPath } from "../utils/settings";


const audioLoader = new AudioLoader();


let engineBuffer: AudioBuffer

export const loadEngineSoundBuffer = (): Promise<AudioBuffer> => {
    return new Promise((resolve, reject) => {
        audioLoader.load(getStaticPath("sound/engine.mp3"), (buffer: AudioBuffer) => {
            engineBuffer = buffer
            resolve(engineBuffer)
        }, () => { }, (err) => {
            console.warn("Error loading engine sound.")
            reject()
        })
    })
}

export const loadSkidSoundBuffer = (): Promise<AudioBuffer> => {
    return new Promise<AudioBuffer>((resolve, reject) => {
        audioLoader.load(getStaticPath("sound/skid5.ogg"), (buffer: AudioBuffer) => {
            engineBuffer = buffer
            resolve(engineBuffer)
        }, () => { }, (err) => {
            console.warn("Error loading skid sound.")
            reject()
        })
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

export const loadMusic = (file: string): Promise<AudioBuffer> => {
    return new Promise<AudioBuffer>((resolve, reject) => {
        audioLoader.load(getStaticPath(`music/${file}`), (buffer: AudioBuffer) => {
            engineBuffer = buffer
            resolve(engineBuffer)
        }, () => { }, (err) => {
            console.warn("Error loading music sound.", file)
            reject()
        })
    })
}

let music: Audio

export const addMusic = (volume: number, camera: PerspectiveCamera, filename: string) => {
    if (camera && getDeviceType() === "desktop" && !music) {
        const listener = new AudioListener()
        camera.add(listener)
        music = new Audio(listener)
        loadMusic(filename).then((buffer) => {
            music.setBuffer(buffer)
            music.setLoop(true)
            music.setVolume(volume)
            music.play()
        })
    }
}

export const setMusicVolume = (volume: number) => {
    music.setVolume(volume)
}

export const stopMusic = () => {
    music?.stop()

}