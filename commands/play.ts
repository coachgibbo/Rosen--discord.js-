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
import { getVoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { Song } from "../model/music/Song";
import { MusicPlayer } from "../model/music/MusicPlayer";
import { RosenClient } from "../model/RosenClient";
import { joinUtils } from "../utils/JoinUtils";
import {YouTubeVideo} from "play-dl";
import {EmbedUtils} from "../utils/EmbedUtils";

module.exports = {
	data: new SlashCommandBuilder() // Discord Command Builder
		.setName('play') // Command Name
		.setDescription('Plays a song off YouTube') // Command Desc (Shown in disc)
		.addStringOption(option => option.setName('song').setDescription("The song to search for").setRequired(true)),
	execute: async function (interaction: CommandInteraction): Promise<void> {
		const client = <RosenClient>interaction.client;
		const user = <GuildMember>interaction.member;
		const youtubeClient = client.getYoutubeClient();
		const responseEmbed = EmbedUtils.buildEmbed();

		// Gate clause if caller is not in a voice channel
		if (!(user.voice.channel)) {
			responseEmbed.setDescription(`Join a voice channel first`).setColor(`#ff0000`);
			await interaction.reply({ embeds: [responseEmbed.build()] });
			return;
		}

		// Extract search query and update caller on command status
		const searchQuery = interaction.options.getString('song');
		responseEmbed.setTitle(`Playing ${searchQuery}`)
			.setDescription(`Searching for ${searchQuery}`)
			.setColor(`#eb7e18`)
		await interaction.reply({ embeds: [responseEmbed.build()] })

		// Call YouTube client to get search results
		const video = await youtubeClient.getVideo(searchQuery!)
		const videoId = video.id
		const videoTitle = video.title

		responseEmbed.setDescription(`Song retrieved with id: ${videoId}`).setColor(`#12a32a`);
		await interaction.editReply({ embeds: [responseEmbed.build()] });

		// Create a Song object with information necessary for playing the track
		const song = new Song({
			id: videoId!,
			title: videoTitle!,
			onStart: () => {},
			onFinish: () => {},
			onError: () => {}
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
		if (musicPlayer.isPlaying()) {
			responseEmbed.setTitle(`Yessir`)
				.setDescription(`Added ${song.title} to queue in position ${musicPlayer.getQueueSize()}`)
				.setColor(`#1cafc5`);
			await interaction.editReply({ embeds: [responseEmbed.build()] });
			return;
		} else {
			// Check if voice connection exists and joins if not. Connect player to connection
			let connection = getVoiceConnection(interaction.guildId!);

			// If not connected to a server then join the users
			try {
				if (!connection || connection?.state.status === VoiceConnectionStatus.Disconnected) {
					connection = await joinUtils(interaction);
				}
			} catch (error) {
				console.log(`Error when joining server\n${error}`);
			}

			connection?.subscribe(musicPlayer.getAudioPlayer());
			await musicPlayer.play();
		}

		// Spotify Recommendations
		// Get the client and generate recommendations
		const spotifyClient = client.getSpotifyClient();
		const recs = await spotifyClient.generateRecommendations(searchQuery!);
		console.log(recs[2]);

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
		responseEmbed.setTitle(`Yessir`)
			.setDescription(`Now Playing: ${song.title}`)
			.setColor(`#1cafc5`);

		await interaction.editReply({
			embeds: [responseEmbed.build()],
			components: [choose]
		})

		// Create a collector that will watch for button presses
		const buttonCollector = interaction.channel?.createMessageComponentCollector({
			max: 3,
			time: 1000 * 15
		});

		// Indicate what is to be done when a buttonInteraction is collected
		buttonCollector?.on('collect', (bInteraction: ButtonInteraction) => {
			const buttonEmbed = EmbedUtils.buildEmbed()
				.setTitle(`Added to Queue`)
				.setColor(`#1cafc5`);

			if (bInteraction.customId === 'opt1') {
				youtubeClient.getVideo(`${recs[0]['name']} ${recs[0]['artists'][0]['name']}`).then((video: YouTubeVideo) => {
					musicPlayer?.addToQueue(new Song({
						id: video.id!,
						title: recs[0]['name'],
						onStart: () => {},
						onFinish: () => {},
						onError: () => {}
					}));
					buttonEmbed.setDescription(`Queued ${recs[0]['name']} in position ${musicPlayer?.getQueueSize()}`);
					bInteraction.reply({ embeds: [buttonEmbed.build()] })
				});
			} else if (bInteraction.customId === 'opt2') {
				youtubeClient.getVideo(`${recs[1]['name']} ${recs[1]['artists'][0]['name']}`).then((video: YouTubeVideo) => {
					musicPlayer?.addToQueue(new Song({
						id: video.id!,
						title: recs[1]['name'],
						onStart: () => {},
						onFinish: () => {},
						onError: () => {}
					}));
					buttonEmbed.setDescription(`Queued ${recs[1]['name']} in position ${musicPlayer?.getQueueSize()}`);
					bInteraction.reply({ embeds: [buttonEmbed.build()] })
				});
			} else if (bInteraction.customId === 'opt3') {
				youtubeClient.getVideo(`${recs[2]['name']} ${recs[2]['artists'][0]['name']}`).then((video: YouTubeVideo) => {
					musicPlayer?.addToQueue(new Song({
						id: video.id!,
						title: recs[2]['name'],
						onStart: () => {},
						onFinish: () => {},
						onError: () => {}
					}));
					buttonEmbed.setDescription(`Queued ${recs[2]['name']} in position ${musicPlayer?.getQueueSize()}`);
					bInteraction.reply({ embeds: [buttonEmbed.build()] })
				});
			}
		});

		// Indicate what is to be done when the button 'expires'
		buttonCollector?.on('end', () => {
			interaction.editReply({
				embeds: [responseEmbed.build()],
				components: []
			})
		});
	}
}