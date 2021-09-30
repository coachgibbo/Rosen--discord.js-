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
import { CommandInteraction, GuildMember } from "discord.js";
import { AudioPlayerStatus, createAudioPlayer, getVoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { Song } from "../resources/Song";
import { players } from "../resources/TempStorage";
import { MusicPlayer } from "../resources/MusicPlayer";

const YoutubeSearch = require("../utilities/YoutubeSearch");
const JoinUtility = require("../utilities/joinChannel");

module.exports = {
	data: new SlashCommandBuilder() // Discord Command Builder
		.setName('play') // Command Name
		.setDescription('Plays a song off YouTube') // Command Desc (Shown in disc)
		.addStringOption(option => option.setName('song').setDescription("The song to search for").setRequired(true)),
	async execute(interaction: CommandInteraction) {
		// Gate Clause if caller is not in a voice channel
		if (!((interaction.member as GuildMember).voice.channel)) {
			await interaction.reply("Join a voice channel first");
			return;
		}

		// Extract search query and update caller on command status
		const searchQuery = interaction.options.getString('song');
		await interaction.reply(`Searching for ${searchQuery} :orange_circle:`)

		// Use Youtube API to grab search results. Indicate success to caller.
		// await works for now. consider switching to promises if doing spotify stuff too
		const searchResults = await YoutubeSearch.loadYoutube(searchQuery).catch(console.error);
		const videoId = searchResults.data.items[0].id.videoId
		await interaction.editReply(`Song retrieved with id: ${videoId} :green_circle:`);

		// Create a Song object with information necessary for playing the track
		const song = new Song({
			id: videoId,
			title: searchResults.data.items[0].snippet.title,
			onStart: () => { },
			onFinish: () => { },
			onError: () => { }
		});

		// Retrieves this servers player from the players Map. Create and store one if none exists
		let musicPlayer = players.get(interaction.guildId!);
		if (!musicPlayer) { 
			musicPlayer = new MusicPlayer();
			players.set(interaction.guildId!, musicPlayer);
		}

		musicPlayer.addToQueue(song)
		if (musicPlayer.audioPlayer.state.status === AudioPlayerStatus.Playing) {
			interaction.editReply(`Added ${song.title} to queue in position ${musicPlayer.queueSize}`)
			return;
		}
		musicPlayer.play()
		
		// Check if voice connection exists and joins if not. Connect player to connection
		let connection = getVoiceConnection(interaction.guildId!)
		
		// If not connected to a server or VoiceConnectionStatus has become disconnected from being idle,
		// Run the JoinUtility to join the server. Wrapped in a try-catch in case something goes wrong.
		try {
			if (!connection || connection?.state.status === VoiceConnectionStatus.Disconnected) {
				connection = await JoinUtility.joinChannel(interaction);
			}
			
		} catch (error) {
			throw error;
		}
		
		// Once connection is retrieved, subscribe the AudioPlayer.
		connection?.subscribe(musicPlayer.audioPlayer)

		interaction.editReply(`Now Playing: ${song.title}`)
	}
}