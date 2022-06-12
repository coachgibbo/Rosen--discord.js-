import {ModalSubmitInteraction} from "discord-modals";
import {RosenClient} from "../model/RosenClient";

module.exports = {
    name: 'modalSubmit',
    async execute(modal: ModalSubmitInteraction) {
        const client = modal.client as RosenClient;
        if (modal.customId == 'play-modal') {
            await client.getCommand('play').execute(modal);
        }
       await modal.deleteReply();
    }
}