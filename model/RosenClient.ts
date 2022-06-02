import { Client, ClientOptions, Collection, Snowflake } from "discord.js";
import { MusicPlayer } from "./music/MusicPlayer";
import { SpotifyClient } from "./apis/SpotifyClient";
import {YoutubeClient} from "./apis/YoutubeClient";

export class RosenClient extends Client {
	private commands: Collection<any, any>;
	private players: Map<Snowflake, MusicPlayer>;

	private youtubeClient: YoutubeClient;
	private spotifyClient: SpotifyClient;

	constructor(props: ClientOptions) {
		super(props);

		this.commands = new Collection();
		this.players = new Map<Snowflake, MusicPlayer>();
		this.youtubeClient = new YoutubeClient();
		this.spotifyClient = new SpotifyClient();
	}

	public getPlayer(guildId: string) {
		return this.players.get(guildId);
	}

	public setPlayer(guildId: string, player: MusicPlayer) {
		this.players.set(guildId, player);
	}

	public getYoutubeClient(): YoutubeClient {
		return this.youtubeClient;
	}

	public getSpotifyClient(): SpotifyClient {
		return this.spotifyClient;
	}

	public setCommand(name: string, command: any) {
		this.commands.set(name, command);
	}
}