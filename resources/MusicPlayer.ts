import { AudioPlayer, AudioPlayerStatus, createAudioPlayer } from "@discordjs/voice";
import { Song } from "./Song"

export class MusicPlayer {
	public readonly audioPlayer: AudioPlayer;
	public queue: Song[];
	public queueSize: number;

	public constructor() {
		this.audioPlayer = createAudioPlayer();
		this.queue = [];
		this.queueSize = 0;

		this.audioPlayer.on('stateChange', (oldState, newState) => {
			if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
				this.play();
			} else if (newState.status === AudioPlayerStatus.Playing) {
				console.log("A new track has started playing")
			}
		})
	}

	public play() {
		if (this.queueSize === 0) {
			console.log("The queue is empty");
			return;
		} else if (this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
			console.log("Something's already playing")
			return;
		}

		const nextStream = this.queue.shift()?.createAudioResource();
		this.queueSize -= 1;
		this.audioPlayer.play(nextStream!);
	}

	public addToQueue(song: Song) {
		this.queue.push(song);
		this.queueSize += 1;
	}

	public skip() {
		this.audioPlayer.stop(true)
	}

	public isPlaying() {
		return (this.audioPlayer.state.status === AudioPlayerStatus.Playing);
	}
}