import {ColorResolvable, MessageEmbed} from "discord.js";

export class EmbedUtils {
    public static buildEmbed() {
        return new EmbedUtils.Builder;
    }

    static Builder = class {
        private embed: MessageEmbed;

        constructor() {
            this.embed = new MessageEmbed();
        }

        setTitle(title: string): this {
            this.embed.setTitle(title);
            return this;
        }

        setColor(color: string): this {
            if (color.at(0) != '#') {
                console.log('Invalid embed color')
                color = 'RED'
            }

            this.embed.setColor(<ColorResolvable>color);
            return this;
        }

        setDescription(description: string) {
            this.embed.setDescription(description);
            return this;
        }

        build(): MessageEmbed {
            return this.embed;
        }

    }
}