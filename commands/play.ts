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
import { getVoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { MusicPlayer } from "../model/music/MusicPlayer";
import { RosenClient } from "../model/RosenClient";
import { joinUtils } from "../utils/JoinUtils";
import { EmbedUtils } from "../utils/EmbedUtils";
import { ModalSubmitInteraction } from "discord-modals";
import { MusicUtils } from "../utils/MusicUtils";

module.exports = {
	data: new SlashCommandBuilder() // Discord Command Builder
		.setName('play') // Command Name
		.setDescription('Plays a song off YouTube') // Command Desc (Shown in disc)
		.addStringOption(option => option.setName('song').setDescription("The song to search for").setRequired(true)),
	execute: async function (interaction: CommandInteraction): Promise<void> {
		const client = <RosenClient>interaction.client;
		const user = <GuildMember>interaction.member;
		const youtubeClient = client.getYoutubeClient();
		const responseEmbed = EmbedUtils.buildEmbed();

		// Gate clause if caller is not in a voice channel
		if (!(user.voice.channel)) {
			responseEmbed.setDescription(`Join a voice channel first`).setColor(`#ff0000`);
			await interaction.reply({ embeds: [responseEmbed.build()] });
			return;
		}

		// Modals being introduced in discord.js v14, having to use external discord-modals for this functionality.
		// Hence-why there is no ts compatibility between CommandInteraction and ModalSubmitInteraction
		let searchQuery = ""
		if (interaction.type == 'MODAL_SUBMIT') {
			searchQuery = (interaction as any as ModalSubmitInteraction).getTextInputValue('song-input')
		} else if (interaction.isSelectMenu()){
			searchQuery = interaction.values.at(0)!;
		} else {
			searchQuery = interaction.options.getString('song')!;
		}
		responseEmbed.setTitle(`Playing ${searchQuery}`)
			.setDescription(`Searching for ${searchQuery}`)
			.setColor(`#eb7e18`)
		await interaction.reply({ embeds: [responseEmbed.build()] })

		// Call YouTube client to get search results
		const video = await youtubeClient.getVideo(searchQuery!)
		const song = MusicUtils.videoToSong(video, searchQuery, user.displayName);

		// Retrieves this servers player from the players Map. Create and store one if none exists
		let musicPlayer = client.getPlayer(interaction.guildId!);
		if (!musicPlayer) {
			musicPlayer = new MusicPlayer(interaction);
			client.setPlayer(interaction.guildId!, musicPlayer);
		}

		// Add the song to a music queue if something is playing. If not, play queue.
		musicPlayer.addToQueue(song)
		if (musicPlayer.isPlaying()) {
			await musicPlayer.embedQueue(song)
			await interaction.deleteReply();
			return;
		} else {
			// Check if voice connection exists and joins if not. Connect player to connection
			let connection = getVoiceConnection(interaction.guildId!);

			// If not connected to a server then join the users
			try {
				if (!connection || connection?.state.status === VoiceConnectionStatus.Disconnected) {
					connection = await joinUtils(interaction);
				}
			} catch (error) {
				console.log(`Error when joining server\n${error}`);
			}

			connection?.subscribe(musicPlayer.getAudioPlayer());

			await musicPlayer.play();
		}
		if (!(musicPlayer.embedExists())){
			await musicPlayer.generateEmbed();
		}
		await interaction.deleteReply();
	}
}