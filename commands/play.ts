/**
 * A command that:
 * 		1. Takes a string query
 * 		2. Uses string to search Youtube via Youtube API
 * 		3. Retrieves information from the first result
 * 		4. Uses this to download the song (via ffmpeg?)
 * 		5. Joins the callers voice channel if not already there
 * 		6. Plays the song
 */
import { SlashCommandBuilder } from "@discordjs/builders";
import { ButtonInteraction, CommandInteraction, GuildMember, MessageActionRow, MessageButton } from "discord.js";
import { AudioPlayerStatus, getVoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { Song } from "../resources/Song";
import { MusicPlayer } from "../resources/MusicPlayer";
import { RosenClient } from "../resources/RosenClient";
import { loadYoutube, getId } from "../utilities/YoutubeSearch";
import { joinChannel } from "../utilities/joinChannel";

module.exports = {
	data: new SlashCommandBuilder() // Discord Command Builder
		.setName('play') // Command Name
		.setDescription('Plays a song off YouTube') // Command Desc (Shown in disc)
		.addStringOption(option => option.setName('song').setDescription("The song to search for").setRequired(true)),
	async execute(interaction: CommandInteraction) {
		// Gate Clause if caller is not in a voice channel
		if (!((interaction.member as GuildMember).voice.channel)) {
			await interaction.reply("Join a voice channel first");
			return;
		}

		// Create a variable to easily access the Client and indicate that it's of type RosenClient
		const client = interaction.client as RosenClient

		// Extract search query and update caller on command status
		const searchQuery = interaction.options.getString('song');
		await interaction.reply(`Searching for ${searchQuery} :orange_circle:`)

		// Use Youtube API to grab search results. Indicate success to caller.
		// await works for now. consider switching to promises if doing spotify stuff too
		const video =  (await loadYoutube(searchQuery!)).data.items![0]
		const videoId = video.id?.videoId
		await interaction.editReply(`Song retrieved with id: ${videoId} :green_circle:`);

		// Create a Song object with information necessary for playing the track
		const song = new Song({
			id: videoId!,
			title: video.snippet!.title!,
			onStart: () => { },
			onFinish: () => { },
			onError: () => { }
		});

		// Retrieves this servers player from the players Map. Create and store one if none exists
		let musicPlayer = client.getPlayer(interaction.guildId!);
		if (!musicPlayer) { 
			musicPlayer = new MusicPlayer();
			client.setPlayer(interaction.guildId!, musicPlayer);
		}

		// Add the song to a music queue if something is playing. If not, play queue.
		// Added into if-else so all calls get recommendations
		musicPlayer.addToQueue(song)
		if (musicPlayer.audioPlayer.state.status === AudioPlayerStatus.Playing) {
			interaction.editReply(`Added ${song.title} to queue in position ${musicPlayer.queueSize}`)
		} else {
			musicPlayer.play()
		
			// Check if voice connection exists and joins if not. Connect player to connection
			let connection = getVoiceConnection(interaction.guildId!)
			
			// If not connected to a server or VoiceConnectionStatus has become disconnected from being idle,
			// Run the JoinUtility to join the server. Wrapped in a try-catch in case something goes wrong.
			try {
				if (!connection || connection?.state.status === VoiceConnectionStatus.Disconnected) {
					connection = await joinChannel(interaction);
				}
			} catch (error) {
				throw error;
			}
			
			// Once connection is retrieved, subscribe the AudioPlayer.
			connection?.subscribe(musicPlayer.audioPlayer)
		}

		// Spotify Recommendations
		// Get the client and generate recommendations
		const recs = await client.generateRecommendations(searchQuery!);

		// Create a button row with the three recommendations
		const choose = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('opt1')
					.setLabel(`${recs[0]['name']} - ${recs[0]['artists'][0]['name']}`.substring(0, 80))
					.setStyle("PRIMARY"),
				new MessageButton()
					.setCustomId('opt2')
					.setLabel(`${recs[1]['name']} - ${recs[1]['artists'][0]['name']}`.substring(0, 80))
					.setStyle("PRIMARY"),
				new MessageButton()
					.setCustomId('opt3')
					.setLabel(`${recs[2]['name']} - ${recs[2]['artists'][0]['name']}`.substring(0, 80))
					.setStyle("PRIMARY"),
			);

		// Create Now Playing message and give song recs as buttons
		interaction.editReply({
			content: `Now Playing: ${song.title}`,
			components: [choose]
		})

		// Create a collector that will watch for button presses
		const buttonCollector = interaction.channel?.createMessageComponentCollector({
			max: 3,
			time: 1000 * 15
		});

		// Indicate what is to be done when a buttonInteraction is collected
		buttonCollector?.on('collect', (bInteraction: ButtonInteraction) => {
			if (bInteraction.customId === 'opt1'){
				getId(recs[0]['name']).then((id: string) => {
					console.log(id)
					musicPlayer?.addToQueue(new Song({
						id: id,
						title: recs[0]['name'],
						onStart: () => { },
						onFinish: () => { },
						onError: () => { }
					}));
					bInteraction.reply(`Queued ${recs[0]['name']} in position ${musicPlayer?.queueSize}`)
				});
			} else if (bInteraction.customId === 'opt2') {
				getId(recs[1]['name']).then((id: string) => {
					musicPlayer?.addToQueue(new Song({
						id: id,
						title: recs[1]['name'],
						onStart: () => { },
						onFinish: () => { },
						onError: () => { }
					}));
					bInteraction.reply(`Queued ${recs[1]['name']} in position ${musicPlayer?.queueSize}`)
				});
			} else if (bInteraction.customId === 'opt3') {
				getId(recs[2]['name']).then((id: string) => {
					musicPlayer?.addToQueue(new Song({
						id: id,
						title: recs[2]['name'],
						onStart: () => { },
						onFinish: () => { },
						onError: () => { }
					}));
					bInteraction.reply(`Queued ${recs[2]['name']} in position ${musicPlayer?.queueSize}`)
				});
			}
		});

		// Indicate what is to be done when the button 'expires'
		buttonCollector?.on('end', () => {
			interaction.editReply({
				content: `Now Playing: ${song.title}`,
				components: []
			})
		});
	}
}