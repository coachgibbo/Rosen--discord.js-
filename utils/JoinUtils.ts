import { DiscordGatewayAdapterCreator, entersState, joinVoiceChannel, VoiceConnectionStatus } from "@discordjs/voice";
import { CommandInteraction, GuildMember } from "discord.js";

export async function joinUtils(interaction: CommandInteraction) {
	// Create the VoiceConnection and set channel parameters from caller
	const connection = joinVoiceChannel({
		channelId: (interaction.member as GuildMember).voice.channel?.id!,
		guildId: (interaction.member as GuildMember).voice.channel?.guildId!,
		adapterCreator: (interaction.member as GuildMember).voice.channel?.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
	});

	// Catch if the bot doesn't connect and destroy the connection
	// Return it if connection is successful
	try{
		await entersState(connection, VoiceConnectionStatus.Ready, 15e3);
		return connection;
	} catch (error) {
		connection.destroy();
		throw error;
	}
}