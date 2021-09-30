import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { players } from "../resources/TempStorage";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skip the currently playing song'),
	async execute(interaction: CommandInteraction) {
		const musicPlayer = players.get(interaction.guildId!);

		if (!musicPlayer?.isPlaying) {
			interaction.reply("Nothing's playing");
			return;
		}

		musicPlayer.skip();
		interaction.reply("Yessir");
	}
}