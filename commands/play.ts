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
import {
	ButtonInteraction,
	CommandInteraction,
	GuildMember, InteractionCollector,
	MessageActionRow,
	MessageButton, MessageComponentInteraction,
} from "discord.js";
import { getVoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { Song } from "../model/music/Song";
import { MusicPlayer } from "../model/music/MusicPlayer";
import { RosenClient } from "../model/RosenClient";
import { joinUtils } from "../utils/JoinUtils";
import {YouTubeVideo} from "play-dl";
import {EmbedUtils} from "../utils/EmbedUtils";
import {ModalSubmitInteraction} from "discord-modals";

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

		// Modals being introduced in discord.js v14, having to use external discord-modals for this functionality.
		// Hence-why there is no ts compatibility between CommandInteraction and ModalSubmitInteraction
		let searchQuery = ""
		if (interaction.type == 'MODAL_SUBMIT') {
			searchQuery = (interaction as any as ModalSubmitInteraction).getTextInputValue('song-input')
		} else {
			searchQuery = interaction.options.getString('song')!;
		}
		responseEmbed.setTitle(`Playing ${searchQuery}`)
			.setDescription(`Searching for ${searchQuery}`)
			.setColor(`#eb7e18`)
		await interaction.reply({ embeds: [responseEmbed.build()] })

		// Call YouTube client to get search results
		const video = await youtubeClient.getVideo(searchQuery!)
		const videoId = video.id
		const videoTitle = video.title

		// Create a Song object with information necessary for playing the track
		const song = new Song({
			id: videoId!,
			title: videoTitle!,
			duration: video.durationInSec,
			thumbnail: video.thumbnails.at(0)?.url!,
			requestor: user.displayName,
			onStart: () => {},
			onFinish: () => {},
			onError: () => {}
		});

		// Retrieves this servers player from the players Map. Create and store one if none exists
		let musicPlayer = client.getPlayer(interaction.guildId!);
		if (!musicPlayer) {
			musicPlayer = new MusicPlayer(interaction);
			client.setPlayer(interaction.guildId!, musicPlayer);
		}

		// Add the song to a music queue if something is playing. If not, play queue.
		musicPlayer.addToQueue(song)
		if (musicPlayer.isPlaying()) {
			await musicPlayer.embedQueue(song)
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
		await musicPlayer.generateEmbed();
		await interaction.deleteReply();
	},
	generateRecommendations: async function (
		client: RosenClient,
		interaction: CommandInteraction,
		searchQuery: string,
		musicPlayer: MusicPlayer
	): Promise<[MessageActionRow, InteractionCollector<MessageComponentInteraction>]> {
		// Spotify Recommendations
		// Get the client and generate recommendations
		const spotifyClient = client.getSpotifyClient();
		const recs = await spotifyClient.generateRecommendations(searchQuery!);

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

		// Create a collector that will watch for button presses
		const buttonCollector = interaction.channel?.createMessageComponentCollector({
			max: 3,
			time: 1000 * 15
		});

		const youtubeClient = client.getYoutubeClient();

		// Indicate what is to be done when a buttonInteraction is collected
		buttonCollector?.on('collect', (bInteraction: ButtonInteraction) => {
			const buttonEmbed = EmbedUtils.buildEmbed()
				.setTitle(`Added to Queue`)
				.setColor(`#1cafc5`);

			if (bInteraction.customId === 'opt1') {
				youtubeClient.getVideo(`${recs[0]['name']} ${recs[0]['artists'][0]['name']}`).then((video: YouTubeVideo) => {
					musicPlayer!.addToQueue(new Song({
						id: video.id!,
						title: recs[0]['name'],
						duration: video.durationInSec,
						thumbnail: video.thumbnails.at(0)?.url!,
						requestor: `${client.user!.tag}`,
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
						duration: video.durationInSec,
						thumbnail: video.thumbnails.at(0)?.url!,
						requestor: `${client.user!.tag}`,
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
						duration: video.durationInSec,
						thumbnail: video.thumbnails.at(0)?.url!,
						requestor: `${client.user!.tag}`,
						onStart: () => {},
						onFinish: () => {},
						onError: () => {}
					}));
					buttonEmbed.setDescription(`Queued ${recs[2]['name']} in position ${musicPlayer?.getQueueSize()}`);
					bInteraction.reply({ embeds: [buttonEmbed.build()] })
				});
			}
		});

		return [choose, buttonCollector!];
	}
}