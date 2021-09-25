/**
 * A command that tells the bot to join the user's channel
 */
import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from '@discordjs/builders';

module.exports = {
	data: new SlashCommandBuilder() // Discord Command Builder
		.setName('join') // Command Name
		.setDescription('Joins the user\'s voice channel'), // Command Desc (Shown in disc)
	async execute(interaction: CommandInteraction) {
		await interaction.reply('Joining'); // Reply to the interaction (message)
	}
}