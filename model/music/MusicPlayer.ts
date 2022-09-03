import {AudioPlayer, AudioPlayerStatus, AudioResource, createAudioPlayer, getVoiceConnection} from "@discordjs/voice";
import { Song } from "./Song"
import {MusicPlayerEmbed} from "./MusicPlayerEmbed";
import {CommandInteraction, TextChannel} from "discord.js";
import {RosenClient} from "../RosenClient";
import {MusicUtils} from "../../utils/MusicUtils";

export class MusicPlayer {
	public readonly client: RosenClient;
	private audioPlayer: AudioPlayer;
	private guildId: string;
	private queue: Song[];
	private currentSong: Song | null;
	private radioSong: string | null;
	private currentStream: AudioResource | null;
	private musicPlayerEmbed: MusicPlayerEmbed;
	private inactiveTimer: NodeJS.Timer | null;

	public constructor(interaction: CommandInteraction) {
		this.audioPlayer = createAudioPlayer();
		this.client = interaction.client as RosenClient;
		this.guildId = interaction.guildId!;
		this.queue = [];
		this.currentSong = null;
		this.radioSong = null;
		this.currentStream = null;
		this.musicPlayerEmbed = new MusicPlayerEmbed(this, interaction.channel as TextChannel);
		this.inactiveTimer = null;

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
			if (this.musicPlayerEmbed.isRadioOn()) {
				console.log("Playing next song from Rosen Radio");
				await this.playRadio();
				if (!this.radioSong) {
					await this.startInactiveTimer();
					return;
				}
			} else {
				console.log("The queue is empty");
				await this.startInactiveTimer();
				return;
			}
		} else if (this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
			console.log("Something's already playing")
			return;
		}
		clearTimeout(this.inactiveTimer!);

		const nextSong = this.queue.shift();
		const nextStream = await nextSong?.createAudioResource();
		this.audioPlayer.play(nextStream!);
		this.currentStream = nextStream!;
		this.currentSong = nextSong!;
		await this.musicPlayerEmbed.updateSongPlaying(nextSong!);
	}

	public async playRadio() {
		if (!this.radioSong) {
			await this.musicPlayerEmbed.toggleRadio();
			return;
		}

		const video = await this.client.getYoutubeClient().getVideo(this.radioSong!);
		const song = MusicUtils.videoToSong(video, this.radioSong!, 'RosenRadio')
		this.addToQueue(song);
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

	public async skip() {
		this.audioPlayer.stop(true)
		await this.musicPlayerEmbed.log('Skipped', false)
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

	public setRadioSong(song: string | null): void {
		this.radioSong = song;
	}

	public embedExists() {
		return this.musicPlayerEmbed.embedMessage != null;
	}

	private async startInactiveTimer() {
		await this.musicPlayerEmbed.updateNothingPlaying();
		this.inactiveTimer = setTimeout(async () => {
			getVoiceConnection(this.guildId)?.destroy();
			await this.musicPlayerEmbed.updateInactive();
		}, 300000);
	}
}