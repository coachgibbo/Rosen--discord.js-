import { CommandInteraction } from "discord.js";

module.exports = {
	name: 'interactionCreate',
	async execute(interaction: CommandInteraction) {
		if (!interaction.isCommand()) return; // Exits instantly if not a command
	
		const command = (interaction.client as any).commands.get(interaction.commandName); // Retrieves command from client
	
		if (!command) return; // Exits if command doesn't exist
	
		// Execute command, catch any errors that occur during operation
		try {
			await command.execute(interaction)
		} catch {
			console.error(Error);
			if (interaction.replied) {
				await interaction.editReply({ content: "Something went wrong buddy" });
			} else {
				await interaction.reply({ content: "Something went wrong buddy" });
			}
		}
	},
};