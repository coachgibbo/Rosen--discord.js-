/**
 * A command that tells the bot to leave the server it's currently in
 */

import { SlashCommandBuilder } from "@discordjs/builders";
import { getVoiceConnection, VoiceConnection } from "@discordjs/voice";
import { CommandInteraction } from "discord.js";

module.exports = {
	data: new SlashCommandBuilder() // Discord Command Builder
		.setName('leave') // Command Name
		.setDescription('Leave\'s the voice channel'), // Command Desc (Shown in Discord)
	async execute(interaction: CommandInteraction) {
		// Use guildId to obtain VoiceConnection (1 Voice per Guild)
		const connection = getVoiceConnection(interaction.guildId as string) as VoiceConnection;

		// If not in server, reply and exit
		// Else, destroy the connection to save resources and reply
		if (!connection) {
			await interaction.reply('I\'m not in a voice channel cobba');
			return;
		} else {
			connection.destroy();
			await interaction.reply(`Disconnected by ${interaction.user.username}`);
		}
	}
}