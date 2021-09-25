// Import the relevant discord.js modules
const { Client, Intents } = require('discord.js');
const dotenv = require('dotenv');

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
client.on('ready', () => {
	console.log('Rosen is awake');
});

// Use client token to login to discord
client.login(process.env.TOKEN);