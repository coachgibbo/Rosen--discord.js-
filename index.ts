/**
 * The main file for the Rosen bot. Creates and runs the Discord client and
 * initializes command and event handling.
 */
import { CommandInteraction } from "discord.js";
import fs from 'fs';
import {Client, Collection, Intents } from 'discord.js';
import dotenv from 'dotenv';

// Get environment variables from .env config
dotenv.config();

// Create a discord client instance
const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
	],
}) as any;

// Creates a Discord Collection to store commands and reads command files from the ./commands folder
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.ts'));

// Iterates through command files and stores a (name, file) mapping in client.commands
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

// Prints to console.log when the 'ready' event is completed
// 'ready' = when bot turns on
client.once('ready', () => {
	console.log('Rosen is awake');
});

// Handles what to do on an 'interaction' event
// 'interaction' = a message being sent
client.on('interactionCreate', async (interaction: CommandInteraction) => {
	if (!interaction.isCommand()) return; // Exits instantly if not a command
	
	const command = client.commands.get(interaction.commandName); // Retrieves command from client

	if (!command) return; // Exits if command doesn't exist

	// Execute command, catch any errors that occur during operation
	try {
		await command.execute(interaction)
	} catch {
		console.error(Error);
		await interaction.reply({ content: "Something went wrong buddy" });
	}
});

// Use client token to login to discord
client.login(process.env.TOKEN);