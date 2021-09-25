const { Client, Intents } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
	],
});

client.on('ready', () => {
	console.log('Rosen is awake');

	// const guildId = 890918967684780053;
	// const guild = client.guilds.cache.get(guildId);
});

client.login(process.env.TOKEN);