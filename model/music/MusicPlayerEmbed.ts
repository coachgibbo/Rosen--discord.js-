import {MusicPlayer} from "./MusicPlayer";
import {
    ButtonInteraction,
    Message,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    MessageSelectMenu,
    SelectMenuInteraction,
    TextChannel,
} from "discord.js";
import {Song} from "./Song";
const skipCommand =  require("../../commands/skip");
import {Modal, TextInputComponent, showModal} from 'discord-modals';
import {DateTimeUtils} from "../../utils/DateTimeUtils";

const bar = require(`stylish-text`);

export class MusicPlayerEmbed {
    private musicPlayer: MusicPlayer;
    private embedObject: MessageEmbed;
    private channel: TextChannel;
    private progressBar: any;
    private currentTimer: NodeJS.Timer | null;
    private radioToggle: boolean;
    private controlRow: MessageActionRow;
    private recommendationRow: MessageActionRow;
    public embedMessage: Message | null;


    constructor(musicPlayer: MusicPlayer, channel: TextChannel) {
        this.musicPlayer = musicPlayer;
        this.embedObject = new MessageEmbed();
        this.embedMessage = null;
        this.channel = channel;
        this.currentTimer = null;
        this.radioToggle = false;
        this.controlRow = this.initializeControls();
        this.recommendationRow = this.initializeRecommendations();
        this.initializeProgressBar();
        this.initializeEmbed();
    }

    private initializeEmbed() {
        this.embedObject.setTitle(":cd:  Rosen");
        this.embedObject.setColor(`#12bd12`);
        this.embedObject.addField("Currently Playing:", "A song", false);
        this.embedObject.addField("Requested By:", "Someone", false);
        this.embedObject.addField("Playback Position:", `${bar.progress(20, 0)}`, false);
        this.embedObject.addField("Up Next:", "Nothing in queue", false);
        this.embedObject.addField("Log:", "Added song to queue (1)", false);
        this.embedObject.setThumbnail("https://i.ytimg.com/vi/ubCBPWEvoVY/hq720.jpg?sqp=-oaymwEcCNAFEJQDSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLCOydYCwnxmoEUahr9BZ1p4ppiTrQ")
    }

    private initializeControls() {
        const controlRow = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('play-button')
                .setLabel('▶')
                .setStyle(3),
            new MessageButton()
                .setCustomId('skip')
                .setLabel('⏭')
                .setStyle(2),
            new MessageButton()
                .setCustomId('refresh-recs')
                .setEmoji('🔄')
                .setStyle(2),
            new MessageButton()
                .setCustomId('radio-toggle')
                .setLabel('Radio (off)')
                .setStyle(4)
        );

        this.channel!.createMessageComponentCollector().on('collect', async (buttonInteraction: ButtonInteraction) => {
            switch (buttonInteraction.customId) {
                case 'play-button':
                    const playModal = new Modal().setCustomId('play-modal').setTitle('Play a Song').addComponents(
                        new TextInputComponent()
                            .setCustomId('song-input')
                            .setLabel('Enter a search term:')
                            .setStyle('SHORT')
                            .setRequired(true)
                    );
                    await showModal(playModal, {
                        client: this.musicPlayer.client,
                        interaction: buttonInteraction
                    })
                    break;

                case 'skip':
                    await skipCommand.execute(buttonInteraction);
                    break;

                case 'refresh-recs':
                    if (this.musicPlayer.getCurrentSong() == null) {
                        await this.log("No songs to get recommendations from", false)
                        break;
                    } else {
                        await this.updateRecommendations(this.musicPlayer.getCurrentSong()!)
                        await this.log("Refreshed Recommendations", false);
                    }
                    break;

                case 'radio-toggle':
                    await this.toggleRadio()
                    break;
            }
        })

        return controlRow;
    }

    private initializeRecommendations() {
        const recommendationRow =  new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId('recommendation-dropdown')
                .setPlaceholder('Queue a song to get some recommendations')
                .setDisabled(true)
                .setOptions({
                    label: 'Rec 1',
                    value: 'Recommendation 1'
                })
        );

        this.channel!.createMessageComponentCollector().on('collect', async (selectInteraction: SelectMenuInteraction) => {
            if (!selectInteraction.isSelectMenu()) {
                return;
            }
            this.musicPlayer.client.getCommand('play').execute(selectInteraction)
        });

        return recommendationRow;
    }

    private initializeProgressBar() {
        this.progressBar = bar;
        this.progressBar.default.full = "█";
        this.progressBar.default.empty = " - ";
        this.progressBar.default.start = "";
        this.progressBar.default.end = "";
        this.progressBar.default.text = "{bar}";
    }

    public async generateMessage(): Promise<Message> {
        let current = Math.floor(this.musicPlayer.getCurrentSongTime() / 1000);
        let end = this.musicPlayer.getCurrentSong()!.duration;
        let value = Math.floor(current * (100 / end) / 5);

        this.embedObject.fields.find(field => field.name == "Playback Position:")!.value = `${DateTimeUtils.convertNumberToTime(current)} - [${bar.progress(20, value)}] - ${DateTimeUtils.convertNumberToTime(end!)}`
        this.embedMessage = await this.channel.send({embeds: [this.embedObject], components: [this.controlRow, this.recommendationRow]});

        let updateCounter = 0;
        let intervalTime = (end / 20) * 1000
        this.currentTimer = setInterval(async () => {
            if (updateCounter == 20) {
                clearInterval(this.currentTimer!);
            } else {
                current = Math.floor(this.musicPlayer.getCurrentSongTime() / 1000);
                value = Math.floor(current * (100 / end) / 5);
                end = this.musicPlayer.getCurrentSong()!.duration;
                this.embedObject.fields.find(field => field.name == "Playback Position:")!.value = `${DateTimeUtils.convertNumberToTime(current)} - [${bar.progress(20, value)}] - ${DateTimeUtils.convertNumberToTime(end!)}`
                await this.embedMessage!.edit({embeds: [this.embedObject], components: [this.controlRow, this.recommendationRow]});
            }
        }, intervalTime + 500)

        return this.embedMessage;
    }

    public async bumpMessage() {
        await this.embedMessage?.delete();
        clearInterval(this.currentTimer!);
        this.embedMessage = await this.generateMessage();
    }

    public async updateSongPlaying(song: Song) {
        this.embedObject.setColor(`#12bd12`)
        this.embedObject.fields.find(field => field.name == "Currently Playing:")!.value = `${song.title} - (${DateTimeUtils.convertNumberToTime(song.duration)})`;
        this.embedObject.fields.find(field => field.name == "Requested By:")!.value = `@${song.requestor}`;
        this.embedObject.fields.find(field => field.name == "Playback Position:")!.value = `0:00 - [${bar.progress(20, 0)}] - ${DateTimeUtils.convertNumberToTime(song.duration)}`

        let upNextField = this.embedObject.fields.find(field => field.name == "Up Next:");
        let nextSong = this.musicPlayer.getQueue().at(0)
        if (!(nextSong)) {
            upNextField!.value = "Queue is empty"
        } else {
            upNextField!.value = nextSong.title;
        }

        this.embedObject.setThumbnail(song.thumbnail);
        this.embedObject.fields.find(field => field.name == "Log:")!.value = `Now playing ${song.title}`;
        await this.updateRecommendations(song);
        await this.embedMessage?.edit({embeds: [this.embedObject], components: [this.controlRow, this.recommendationRow]})
    }

    public async updateRecommendations(song: Song) {
        const dropdown = this.recommendationRow.components.at(0) as MessageSelectMenu;
        const recommendations = await this.musicPlayer.client.getSpotifyClient().generateRecommendations(song.searchQuery);
        if (recommendations.length == 0) {
            dropdown.setOptions({
                label: 'Rec 1',
                value: 'Recommendation 1'
            })
            dropdown.setDisabled(true);
            dropdown.setPlaceholder('No recommendations found');
            this.musicPlayer.setRadioSong(null);
            return;
        }

        let options = [];
        let recCounter = 1;
        for (let rec of recommendations) {
            options.push({
                label: `${rec['name']}`.substring(0, 80),
                description: `${rec['artists'][0]['name']}`,
                value: `${rec['name']} ${rec['artists'][0]['name']}`.substring(0, 80)
            })
            recCounter++;
        }
        this.musicPlayer.setRadioSong(recommendations[0]['name'])
        dropdown.setOptions(); // Clear
        dropdown.addOptions(options);
        dropdown.setDisabled(false);
        dropdown.setPlaceholder('Choose a song to add to the queue')
    }

    public async updateNothingPlaying() {
        this.embedObject.setColor(`#f39a1d`);
        this.embedObject.setThumbnail("");
        this.embedObject.fields.find(field => field.name == "Currently Playing:")!.value = "Nothing";
        this.embedObject.fields.find(field => field.name == "Requested By:")!.value = "-";
        this.embedObject.fields.find(field => field.name == "Playback Position:")!.value = "-";
        this.embedObject.fields.find(field => field.name == "Log:")!.value = "Finished playing";
        await this.embedMessage?.edit({embeds: [this.embedObject]})
        clearInterval(this.currentTimer!);
    }

    public async updateAddToQueue(song: Song) {
        let upNextField = this.embedObject.fields.find(field => field.name == "Up Next:");
        let nextSong = this.musicPlayer.getQueue().at(0)
        if (!(nextSong)) {
            upNextField!.value = "Queue is empty :brownlow2019:"
        } else {
            upNextField!.value = nextSong.title;
        }
        await this.log(`Added ${song.title} to queue in position ${this.musicPlayer.getQueueSize()}`, false);
    }

    public async updateInactive() {
        await this.embedMessage?.delete();
        this.embedMessage = null;
    }

    public async log(message: string, bumpRequired: boolean) {
        this.embedObject.fields.find(field => field.name == "Log:")!.value = message;
        if (bumpRequired) {
            await this.bumpMessage();
        } else {
            this.embedMessage?.edit({embeds: [this.embedObject], components: [this.controlRow, this.recommendationRow]})
        }
    }

    public isRadioOn() {
        return this.radioToggle;
    }

    public async toggleRadio() {
        if (!this.radioToggle) {
            this.radioToggle = true;
            (this.controlRow.components.at(3) as MessageButton).setStyle(3).setLabel('Radio (on)');
            await this.log("Radio on", false);
        } else {
            this.radioToggle = false;
            (this.controlRow.components.at(3) as MessageButton).setStyle(4).setLabel('Radio (off)');
            await this.log("Radio off", false);
        }
    }
}