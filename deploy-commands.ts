import fs from 'fs';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import dotenv from 'dotenv';

// Get environemnt variables from dotenv config
dotenv.config();

// Create the list of commands and give them basic metadata
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.ts'));

for (const file of commandFiles) {
	let command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

// Creates a new REST API for sending to Discord
let rest: REST; 
if (process.env.TOKEN){
	rest = new REST({ version: '9'}).setToken(process.env.TOKEN);
} else {
	throw new Error("TOKEN environment variable is not set");
}

// Sends API request
if (process.env.GUILDID && process.env.CLIENTID){
	rest.put(Routes.applicationGuildCommands(process.env.CLIENTID, process.env.GUILDID), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
} else {
	throw new Error("CLIENTID or GUILDID environment variables not set")
}
