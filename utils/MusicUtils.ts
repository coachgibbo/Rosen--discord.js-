import {YouTubeVideo} from "play-dl";
import {Song} from "../model/music/Song";

export class MusicUtils {
    public static videoToSong(video: YouTubeVideo, searchQuery: string, requestor: string) {
        return new Song({
            id: video.id!,
            title: video.title!,
            duration: video.durationInSec,
            thumbnail: video.thumbnails.at(0)?.url!,
            requestor: requestor,
            searchQuery: searchQuery,
            onStart: () => {},
            onFinish: () => {},
            onError: () => {}
        });
    }
}