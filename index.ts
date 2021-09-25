import { CommandInteraction } from "discord.js";
import fs from 'fs';
import {Client, Collection, Intents } from 'discord.js';
import dotenv from 'dotenv';

// Get environment variables from dotenv config
dotenv.config();

// Create a discord client instance
const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
	],
}) as any;

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.ts'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

// Prints to console.log when the 'ready' event is completed
// 'ready' is when bot turns on
client.once('ready', () => {
	console.log('Rosen is awake');
});

client.on('interactionCreate', async (interaction: CommandInteraction) => {
	if (!interaction.isCommand()) return;
	
	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction)
	} catch {
		console.error(Error);
		await interaction.reply({ content: "Something went wrong buddy" });
	}
});

// Use client token to login to discord
client.login(process.env.TOKEN);