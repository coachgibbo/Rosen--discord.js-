// Import the relevant discord.js modules
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const dotenv = require('dotenv');

// Get environemnt variables from dotenv config
dotenv.config()

// Create the list of commands and give them basic metadata
const commands = [
	new SlashCommandBuilder().setName('join').setDescription('Joins the user\'s voice channel'),
	new SlashCommandBuilder().setName('leave').setDescription('Leaves the user\'s voice channel'),
	new SlashCommandBuilder().setName('play').setDescription('Play a song'),
	new SlashCommandBuilder().setName('search').setDescription('Search for a song and play it'),
	new SlashCommandBuilder().setName('skip').setDescription('Skip the currently playing song'),
]
	.map(command => command.toJSON());

// Creates a new REST API for sending to Discord
const rest = new REST({ version: '9'}).setToken(process.env.TOKEN)

// Sends API request
rest.put(Routes.applicationGuildCommands(process.env.CLIENTID, process.env.GUILDID), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);