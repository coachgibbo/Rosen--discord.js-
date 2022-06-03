/**
 * A command that tells the bot to join the user's channel
 */
import { CommandInteraction, GuildMember } from "discord.js";
import { SlashCommandBuilder } from '@discordjs/builders';
import { joinUtils } from "../utils/JoinUtils";
import { EmbedUtils } from "../utils/EmbedUtils";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('join')
		.setDescription('Joins the user\'s voice channel'),
	execute: async function (interaction: CommandInteraction): Promise<void> {
		const voiceChannel = (interaction.member as GuildMember).voice.channel;

		// Handler for when caller is not in a voice channel
		if (!voiceChannel) {
			const embed = EmbedUtils.buildEmbed()
				.setDescription(`You're not in a voice channel`)
				.setColor(`#ff0000`);
			await interaction.reply({ embeds: [embed.build()] });
			return;
		} else {
			const embed = EmbedUtils.buildEmbed()
				.setTitle(`Joining ${voiceChannel!.name}`)
				.setColor(`#12a32a`);
			await interaction.reply({ embeds: [embed.build()] });
		}

		await joinUtils(interaction);
		const embed = EmbedUtils.buildEmbed()
			.setTitle(`Joined ${(interaction.member as GuildMember).voice.channel!.name}`)
			.setColor(`#12a32a`);
		await interaction.followUp({ embeds: [embed.build()] });
	}
}