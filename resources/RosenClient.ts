import { Client, ClientOptions, Collection, Snowflake } from "discord.js";
import { MusicPlayer } from "./MusicPlayer";
import { SpotifyClient } from "./SpotifyClient";

export class RosenClient extends Client {
	private players: Map<Snowflake, MusicPlayer>;
	private spotifyClient: SpotifyClient;
	public commands: Collection<unknown, unknown>;

	constructor(props: ClientOptions) {
		super(props);

		this.players = new Map<Snowflake, MusicPlayer>();
		this.spotifyClient = new SpotifyClient();

		this.commands = new Collection();
	}

	public getPlayer(guildId: string) {
		return this.players.get(guildId);
	}

	public setPlayer(guildId: string, player: MusicPlayer) {
		this.players.set(guildId, player);
	}

	public async generateRecommendations(query: string) {
		return this.spotifyClient.generateRecommendations(query);
	}
}