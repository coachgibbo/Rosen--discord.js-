/**
 * A command that tells the bot to join the user's channel
 */
import { CommandInteraction, GuildMember } from "discord.js";
import { SlashCommandBuilder } from '@discordjs/builders';
import { DiscordGatewayAdapterCreator, entersState, joinVoiceChannel, VoiceConnectionStatus } from "@discordjs/voice";

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

		// Create the VoiceConnection and set channel parameters from caller
		const connection = joinVoiceChannel({
			channelId: userChannel?.id as string,
			guildId: userChannel?.guildId as string,
			adapterCreator: userChannel?.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
		});

		// Catch if the bot doesn't connect and destroy the connection
		// Return it if connection is successful
		try{
			await entersState(connection, VoiceConnectionStatus.Ready, 15e3);
			await interaction.editReply(`Joined ${userChannel!.name}  :green_circle:`);
			return connection;
		} catch (error) {
			connection.destroy();
			throw error;
		}
	}
}