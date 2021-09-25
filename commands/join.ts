import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from '@discordjs/builders';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('join')
		.setDescription('Joins the user\'s voice channel'),
	async execute(interaction: CommandInteraction) {
		await interaction.reply('Pong!');
	}
}