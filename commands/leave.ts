/**
 * A command that tells the bot to leave the server it's currently in
 */
import { SlashCommandBuilder } from "@discordjs/builders";
import { getVoiceConnection } from "@discordjs/voice";
import { CommandInteraction } from "discord.js";
import {EmbedUtils} from "../utils/EmbedUtils";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leave')
		.setDescription('Leave\'s the voice channel'),
	async execute(interaction: CommandInteraction): Promise<void> {
		// Use guildId to obtain VoiceConnection (1 Voice per Guild)
		const connection = getVoiceConnection(<string>interaction.guildId);

		// If not in server, reply and exit
		// Else, destroy the connection and reply
		if (!connection) {
			const embed = EmbedUtils.buildEmbed()
				.setDescription(`I'm not in a voice channel`)
				.setColor(`#ff0000`);
			await interaction.reply({ embeds: [embed.build()] });
			return;
		} else {
			connection.destroy();
			const embed = EmbedUtils.buildEmbed()
				.setDescription(`Disconnected by ${interaction.user.username}`)
				.setColor(`#eb7e18`);
			await interaction.reply({ embeds: [embed.build()] });
		}
	}
}