import play, {YouTubeVideo} from 'play-dl';

export class YoutubeClient {
    public async getVideo(query: string): Promise<YouTubeVideo> {
        const searchResults = await play.search(query, {
            limit: 1
        });

        return searchResults[0];
    }
}