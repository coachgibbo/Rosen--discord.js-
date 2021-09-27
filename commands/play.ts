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

module.exports = {
	data: new SlashCommandBuilder() // Discord Command Builder
		.setName('play') // Command Name
		.setDescription('Plays a song off YouTube') // Command Desc (Shown in disc)
		.addStringOption(option => option.setName('song').setDescription("The song to search for").setRequired(true)),
	async execute(interaction: CommandInteraction) {
		const searchQuery = interaction.options.getString('song');

		await interaction.reply(`You searched for ${searchQuery}`);
	}
}