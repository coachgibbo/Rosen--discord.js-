import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {RosenClient} from "../model/RosenClient";
import {EmbedUtils} from "../utils/EmbedUtils";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Retrieves the queue'),
    async execute(interaction: CommandInteraction): Promise<void> {
        const musicPlayer = (<RosenClient>interaction.client).getPlayer(interaction.guildId!);
        if (musicPlayer) {
            await interaction.reply(`Queue is empty`);
            return;
        }
        const queue = musicPlayer!.getQueue();

        let descriptionString = "";
        if (queue.length === 0) {
            descriptionString = "Queue is empty"
        } else {
            for (let i = 0; i < queue.length; i++) {
                descriptionString += `${i+1}. ${queue.at(i)?.title}\n`;
            }
        }

        const embed = EmbedUtils.buildEmbed()
            .setTitle(`Queue`)
            .setDescription(descriptionString)
            .setColor(`#1cafc5`);
        await interaction.reply({ embeds: [embed.build()] });
    }
}