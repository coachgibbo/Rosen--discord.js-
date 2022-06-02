/**
 * A client that is created when the bot is created and provides wrapped access to the Spotify API
 * Uses Client Credential Flow for authentication
 */
import SpotifyWebApi from "spotify-web-api-node";

export class SpotifyClient {
	public readonly client: SpotifyWebApi; // Spotify Client (using wrapper)
	private bearer: string // Generated bearer token

	constructor() {
		// Create the client with the relevant client id and client secret
		this.client = new SpotifyWebApi({
			clientId: process.env.SPOTIFY_CLIENT_ID,
			clientSecret: process.env.SPOTIFY_SECRET
		});

		this.bearer = "";
	}

	/**
	 * Takes a search query and generates 3 recommendations using Spotify's browse API
	 * @param query: search query to find a song for
	 * @returns the list of recommendations
	 */
	public async generateRecommendations(query: string) {
		let recommendations: any = []

		// Use the search query to find the spotify seed for the searched song
		recommendations = this.client.searchTracks(query, {
			limit: 1
		})
		.then(async (data) => {
			// If seed is found, use it to generate 3 recommendations from Spotify that are returned
			return this.client.getRecommendations({
				min_popularity: 60,
				seed_tracks: [data.body['tracks']?.items[0].id!],
				limit: 5
			}).then((data) => {
				return data.body['tracks'];
			})
		})
		.catch(async (error) => {
			// If error occurs with code == 401, we know the bearer token is invalid or expired and refresh it
			// We then call the function again
			if (error['body']['error']['status'] == 401) {
				await this.regenerateToken();
				recommendations = this.generateRecommendations(query);
				return recommendations;
			} else {
				console.log(error);
			}
		});

		return recommendations;
	}

	/**
	 * Private function that regenerates bearer token
	 */
	private async regenerateToken() {
		// Uses client id and secret to generate a bearer
		await this.client.clientCredentialsGrant()
			.then((data) => {
				this.bearer = data.body['access_token'];
			})
			.catch((error) => {
				console.log("Something went wrong when retrieving an access token", error);
			})

		// Sets current access token
		this.client.setAccessToken(this.bearer)
	}
}