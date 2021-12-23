import { StoryGameScene } from "../game/StoryGameScene";
import { TrackName } from "../shared-backend/shared-stuff";
import { Course } from "./Course";



export class StoryCourse extends Course {

    constructor(gameScene: StoryGameScene, trackName: TrackName) {
        super(gameScene, trackName)
    }
}