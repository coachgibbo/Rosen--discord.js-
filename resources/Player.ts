import { AudioPlayer } from "@discordjs/voice";
import { Snowflake } from "discord-api-types";

export const players = new Map<Snowflake, AudioPlayer>();