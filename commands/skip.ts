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

		await musicPlayer.skip();
		const skippedEmbed = EmbedUtils.buildEmbed()
			.setDescription(`Skipped`)
			.setColor(`#eb7e18`);
		await interaction.reply({ embeds: [skippedEmbed.build()] });
		setTimeout(async () => {
			await interaction.deleteReply();
		})
	}
}