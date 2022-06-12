import {MusicPlayer} from "./MusicPlayer";
import {
    ButtonInteraction,
    Message,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    TextChannel,
} from "discord.js";
import {Song} from "./Song";
const skipCommand =  require("../../commands/skip");
import {Modal, TextInputComponent, showModal} from 'discord-modals';

const bar = require(`stylish-text`);

export class MusicPlayerEmbed {
    private musicPlayer: MusicPlayer;
    private embedObject: MessageEmbed;
    private embedMessage: Message | null;
    private channel: TextChannel;
    private progressBar: any;
    private currentTimer: NodeJS.Timer | null;
    private radioToggle: boolean;
    private controlRow: MessageActionRow;

    constructor(musicPlayer: MusicPlayer, channel: TextChannel) {
        this.musicPlayer = musicPlayer;
        this.embedObject = new MessageEmbed();
        this.embedMessage = null;
        this.channel = channel;
        this.currentTimer = null;
        this.radioToggle = false;
        this.controlRow = this.initializeControls();
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
                    console.log('refresh-recs')
                    break;

                case 'radio-toggle':
                    if (!this.radioToggle) {
                        this.radioToggle = true;
                        (this.controlRow.components.at(3) as MessageButton).setStyle(3).setLabel('Radio (on)');
                        await this.log("Radio on", false);
                    } else {
                        this.radioToggle = false;
                        (this.controlRow.components.at(3) as MessageButton).setStyle(4).setLabel('Radio (off)');
                        await this.log("Radio off", false);
                    }
                    break;
            }
        })

        return controlRow;
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

        this.embedObject.fields.find(field => field.name == "Playback Position:")!.value = `${this.convertTime(current)} - [${bar.progress(20, value)}] - ${this.convertTime(end!)}`
        this.embedMessage = await this.channel.send({embeds: [this.embedObject], components: [this.controlRow]});

        let updateCounter = 0;
        let intervalTime = (end / 20) * 1000
        this.currentTimer = setInterval(async () => {
            if (updateCounter == 20) {
                clearInterval(this.currentTimer!);
            } else {
                current = Math.floor(this.musicPlayer.getCurrentSongTime() / 1000);
                value = Math.floor(current * (100 / end) / 5);
                end = this.musicPlayer.getCurrentSong()!.duration;
                this.embedObject.fields.find(field => field.name == "Playback Position:")!.value = `${this.convertTime(current)} - [${bar.progress(20, value)}] - ${this.convertTime(end!)}`
                await this.embedMessage!.edit({embeds: [this.embedObject], components: [this.controlRow]});
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
        this.embedObject.fields.find(field => field.name == "Currently Playing:")!.value = `${song.title} - (${this.convertTime(song.duration)})`;
        this.embedObject.fields.find(field => field.name == "Requested By:")!.value = `@${song.requestor}`;

        let upNextField = this.embedObject.fields.find(field => field.name == "Up Next:");
        let nextSong = this.musicPlayer.getQueue().at(0)
        if (!(nextSong)) {
            upNextField!.value = "Queue is empty"
        } else {
            upNextField!.value = nextSong.title;
        }

        this.embedObject.setThumbnail(song.thumbnail);
        this.embedObject.fields.find(field => field.name == "Log:")!.value = `Now playing ${song.title}`
        await this.embedMessage?.edit({embeds: [this.embedObject], components: [this.controlRow]})
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
        await this.log(`Added ${song.title} to queue in position ${this.musicPlayer.getQueueSize()}`, true);
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
            this.embedMessage?.edit({embeds: [this.embedObject], components: [this.controlRow]})
        }
    }

    private convertTime(time: number): string {
        var minutes = Math.floor(time / 60);
        var seconds = "0" + (time - minutes * 60);
        return minutes.toString().slice(-2) + ":" + seconds.slice(-2);
    }
}