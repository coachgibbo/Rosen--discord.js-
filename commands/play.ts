/**
 * A command that:
 * 		1. Takes a string query
 * 		2. Uses string to search Youtube via Youtube API
 * 		3. Retrieves information from the first result
 * 		4. Uses this to download the song (via ffmpeg?)
 * 		5. Joins the callers voice channel if not already there
 * 		6. Plays the song
 */
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { AudioPlayerStatus, createAudioPlayer, getVoiceConnection } from "@discordjs/voice";
import { Song } from "../resources/Song";

const YoutubeSearch = require("../utilities/YoutubeSearch");
const JoinUtility = require("../utilities/joinChannel");

module.exports = {
	data: new SlashCommandBuilder() // Discord Command Builder
		.setName('play') // Command Name
		.setDescription('Plays a song off YouTube') // Command Desc (Shown in disc)
		.addStringOption(option => option.setName('song').setDescription("The song to search for").setRequired(true)),
	async execute(interaction: CommandInteraction) {
		// Extract search query and update caller on command status
		const searchQuery = interaction.options.getString('song');
		await interaction.reply(`Searching for ${searchQuery} :orange_circle:`)

		// Use Youtube API to grab search results. Indicate success to caller.
		// await works for now. consider switching to promises if doing spotify stuff too
		const searchResults = await YoutubeSearch.loadYoutube(searchQuery).catch(console.error);
		const videoId = searchResults.data.items[0].id.videoId
		await interaction.editReply(`Song retrieved with id: ${videoId} :green_circle:`);

		// Create a Song object with information necessary for playing the track
		const resource = new Song({
			id: videoId,
			title: searchResults.data.items[0].snippet.title,
			onStart: () => { },
			onFinish: () => { },
			onError: () => { }
		}).createAudioResource();

		// Create a discord audio player and load the audio resource
		// Maybe move this into join and leave commands
		const player = createAudioPlayer();
		player.play(resource)
		
		// Check if voice connection exists and joins if not. Connect player to connection
		let connection = getVoiceConnection(interaction.guildId!)
		if (!connection) {
			connection = await JoinUtility.joinChannel(interaction);
		}
		connection?.subscribe(player)

		// Once this works completely, delete reply and use an embed for now playing
		await interaction.editReply(`Now Playing: ${searchResults.data.items[0].snippet.title}`)

		player.on(AudioPlayerStatus.Idle, () => console.log("Song Finished"));
	}
}