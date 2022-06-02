import { AudioPlayer, AudioPlayerStatus, createAudioPlayer } from "@discordjs/voice";
import { Song } from "./Song"

export class MusicPlayer {
	private audioPlayer: AudioPlayer;
	private queue: Song[];
	private currentSong: Song | null;

	public constructor() {
		this.audioPlayer = createAudioPlayer();
		this.queue = [];
		this.currentSong = null;

		// @ts-ignore
		this.audioPlayer.on('stateChange', (oldState, newState) => {
			if (newState.status === AudioPlayerStatus.Idle) {
				this.play();
			} else if (newState.status === AudioPlayerStatus.Playing) {
				console.log("A new track has started playing")
			}
		})
	}

	public async play() {
		if (this.queue.length === 0) {
			console.log("The queue is empty");
			return;
		} else if (this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
			console.log("Something's already playing")
			return;
		}

		const nextSong = this.queue.shift();
		const nextStream = await nextSong?.createAudioResource();
		this.audioPlayer.play(nextStream!);
		this.currentSong = nextSong!;
	}

	public addToQueue(song: Song) {
		this.queue.push(song);
	}

	public getQueueSize(): number {
		return this.queue.length;
	}

	public skip(): void {
		this.audioPlayer.stop(true)
	}

	public isPlaying(): boolean {
		return (this.audioPlayer.state.status === AudioPlayerStatus.Playing);
	}

	public getNextSong(): Song | undefined {
		return this.queue.at(0);
	}

	public getAudioPlayer(): AudioPlayer {
		return this.audioPlayer;
	}
}