/**
 * A command that tells the bot to join the user's channel
 */
import { CommandInteraction, GuildMember } from "discord.js";
import { SlashCommandBuilder } from '@discordjs/builders';

const JoinUtility = require("../utilities/joinChannel");

module.exports = {
	data: new SlashCommandBuilder() // Discord Command Builder
		.setName('join') // Command Name
		.setDescription('Joins the user\'s voice channel'), // Command Desc (Shown in disc)
	async execute(interaction: CommandInteraction) {
		var userChannel = (interaction.member as GuildMember).voice.channel; // Get caller's voice channel

		// Handler for when caller is not in a voice channel
		if (!userChannel) {
			await interaction.reply(`You're not in a voice channel`);
			return;
		} else {
			await interaction.reply(`Joining ${userChannel!.name}  :orange_circle:`);
		}

		JoinUtility.joinChannel(interaction);
	}
}