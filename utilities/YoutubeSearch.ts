/**
 * A module that searches Youtube via the API and returns a list of results
 */
import { google, youtube_v3 } from 'googleapis';
import ytsr, { Video } from 'ytsr';

export function loadYoutube(query: string) {
	// Set the Youtube API settings
	const youtube = google.youtube({
		version: 'v3',
		auth: process.env.YT_API_KEY,
	})

	// Set parameters for the Youtube search
	const params: youtube_v3.Params$Resource$Search$List = {
		part: ["snippet"], // How much to return for each video
		type: ["video"], // Type of result items
		maxResults: 25, // Max number of results
		q: query, // Search Query
	}

	// Return the uncompleted promise
	return youtube.search.list(params);
}

export async function getId(query: string) {
	const searchResults = await ytsr(query, {
		limit: 1,
	});
	console.log((searchResults.items[0] as Video).title)
	return (searchResults.items[0] as Video).id
}

module.exports = { loadYoutube, getId }