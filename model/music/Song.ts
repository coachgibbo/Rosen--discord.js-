import { AudioResource, createAudioResource } from "@discordjs/voice";
import play from "play-dl";

/**
 * Creating a resource to extend Discord AudioResource's.
 * Main benefit is that we can specify what information is actually necessary
 * for the song to play as well as callback functions for if an error occurs.
 * Although Discord provides some callbacks this gives more flexibility.
 *
 * It's also better from a memory standpoint as AudioResource's are created
 * as they're needed rather than whenever the play command is called
 */
export interface SongData {
	id: string;
	title: string;
	duration: number;
	thumbnail: string;
	requestor: string;
	onStart: () => void;
	onFinish: () => void;
	onError: (error: Error) => void;
}

export class Song implements SongData{
	public readonly id: string;
	public readonly url: string;
	public readonly title: string;
	public readonly duration: number;
	public readonly thumbnail: string;
	public readonly requestor: string;
	public readonly onStart: () => void;
	public readonly onFinish: () => void;
	public readonly onError: (error: Error) => void;

	constructor({ id, duration, thumbnail, requestor, title, onStart, onFinish, onError }: SongData) {
		this.id = id;
		this.url = "https://www.youtube.com/watch?v=" + id;
		this.title = title;
		this.duration = duration;
		this.thumbnail = thumbnail;
		this.requestor = requestor;
		this.onStart = onStart;
		this.onFinish = onFinish;
		this.onError = onError;
	}

	public async createAudioResource(): Promise<AudioResource> {
		const stream = await play.stream(this.url);

		return createAudioResource(stream.stream, { inputType: stream.type });
	}

}