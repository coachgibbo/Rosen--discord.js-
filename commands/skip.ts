import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { RosenClient } from "../model/RosenClient";
import {EmbedUtils} from "../utils/EmbedUtils";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skip the currently playing song'),
	async execute(interaction: CommandInteraction) {
		const musicPlayer = (interaction.client as RosenClient).getPlayer(interaction.guildId!);

		if (!(musicPlayer?.isPlaying)) {
			const embed = EmbedUtils.buildEmbed()
				.setDescription(`Nothing's Playing`)
				.setColor(`#ff3321`)
			await interaction.reply({ embeds: [embed.build()] });
			return;
		}

		musicPlayer.skip();
		const skippedEmbed = EmbedUtils.buildEmbed()
			.setDescription(`Skipped`)
			.setColor(`#eb7e18`);
		await interaction.reply({ embeds: [skippedEmbed.build()] });

		const nextSong = musicPlayer.getCurrentSong()
		if (!nextSong) {
			return;
		}

		const nowPlayingEmbed = EmbedUtils.buildEmbed()
			.setTitle(`Yessir`)
			.setDescription(`Now Playing: ${musicPlayer.getCurrentSong()!.title}`)
			.setColor(`#1cafc5`);
		await interaction.followUp({ embeds: [nowPlayingEmbed.build()] });
	}
}