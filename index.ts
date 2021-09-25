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
});

// Prints to console.log when the 'ready' event is completed
// 'ready' is when bot turns on
client.once('ready', () => {
	console.log('Rosen is awake');
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	
	const { commandName } = interaction;

	if (commandName === 'join'){
		await interaction.reply('Pong!');
	}
});

// Use client token to login to discord
client.login(process.env.TOKEN);