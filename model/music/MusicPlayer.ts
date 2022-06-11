import {AudioPlayer, AudioPlayerStatus, AudioResource, createAudioPlayer, getVoiceConnection} from "@discordjs/voice";
import { Song } from "./Song"
import {MusicPlayerEmbed} from "./MusicPlayerEmbed";
import {CommandInteraction, TextChannel} from "discord.js";
import {RosenClient} from "../RosenClient";

export class MusicPlayer {
	private audioPlayer: AudioPlayer;
	private client: RosenClient;
	private guildId: string;
	private queue: Song[];
	private currentSong: Song | null;
	private currentStream: AudioResource | null;
	private musicPlayerEmbed: MusicPlayerEmbed;

	public constructor(interaction: CommandInteraction) {
		this.audioPlayer = createAudioPlayer();
		this.client = interaction.client as RosenClient;
		this.guildId = interaction.guildId!;
		this.queue = [];
		this.currentSong = null;
		this.currentStream = null;
		this.musicPlayerEmbed = new MusicPlayerEmbed(this, interaction.channel as TextChannel);

		// @ts-ignore
		this.audioPlayer.on('stateChange',async (oldState, newState) => {
			if (newState.status === AudioPlayerStatus.Idle) {
				await this.play();
			} else if (newState.status === AudioPlayerStatus.Playing) {
				console.log("A new track has started playing")
			}
		})
	}

	public async play() {
		if (this.queue.length === 0) {
			console.log("The queue is empty");
			await this.musicPlayerEmbed.updateNothingPlaying();
			setTimeout(async () => {
				getVoiceConnection(this.guildId)?.destroy();
				await this.musicPlayerEmbed.updateInactive();
			}, 60000)
			return;
		} else if (this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
			console.log("Something's already playing")
			return;
		}

		const nextSong = this.queue.shift();
		const nextStream = await nextSong?.createAudioResource();
		this.audioPlayer.play(nextStream!);
		this.currentStream = nextStream!;
		this.currentSong = nextSong!;
		await this.musicPlayerEmbed.updateSongPlaying(nextSong!);
	}

	public async generateEmbed() {
		await this.musicPlayerEmbed.generateMessage();
	}

	public addToQueue(song: Song) {
		this.queue.push(song);
	}

	public async embedQueue(song: Song) {
		await this.musicPlayerEmbed.updateAddToQueue(song);
	}

	public getQueueSize(): number {
		return this.queue.length;
	}

	public getQueue(): Song[] {
		return this.queue;
	}

	public skip(): void {
		this.audioPlayer.stop(true)
	}

	public isPlaying(): boolean {
		return (this.audioPlayer.state.status === AudioPlayerStatus.Playing);
	}

	public getCurrentSong(): Song | null {
		return this.currentSong;
	}

	public getAudioPlayer(): AudioPlayer {
		return this.audioPlayer;
	}

	public getCurrentSongTime(): number {
		return this.currentStream?.playbackDuration!;
	}
}