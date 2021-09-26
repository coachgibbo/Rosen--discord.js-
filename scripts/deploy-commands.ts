/**
 * A script that uploads a bots slash commands to a specified discord server
 * Doing it to a server is the dev way, there is also a global way that
 * I think brings the commands along with the bot.
 * 
 * Either way, for a private use case this is fine.
 */
import fs from 'fs';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import dotenv from 'dotenv';

// Get environment variables from .env config
dotenv.config();

// Create the commands array and read the command files from the commands directory
// Filters out non-TypeScript files
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.ts'));

// Iterate through commandFiles placing everything into commands and creating a JSON object
for (const file of commandFiles) {
	let command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

// Creates a new REST API for sending to Discord
// Error handling for when no TOKEN exists in .env
let rest: REST; 
if (process.env.TOKEN){
	rest = new REST({ version: '9'}).setToken(process.env.TOKEN);
} else {
	throw new Error("TOKEN environment variable is not set");
}

// Sends API request
// Error handling for if no GUILDID or CLIENTID in .env
if (process.env.GUILDID && process.env.CLIENTID){
	rest.put(Routes.applicationGuildCommands(process.env.CLIENTID, process.env.GUILDID), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
} else {
	throw new Error("CLIENTID or GUILDID environment variables not set")
}
