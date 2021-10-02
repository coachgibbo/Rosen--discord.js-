/**
 * Stores constant variables that vary across guilds.
 * This is a super ad-hoc, temporary solution.
 * Works for now, but I'll update to json later on and if more data is
 * necessary then something like sqlite or mongo will do.
 */
import { Snowflake } from "discord-api-types";
import { MusicPlayer } from "./MusicPlayer";
import { SpotifyClient } from "./SpotifyClient";

export const players = new Map<Snowflake, MusicPlayer>();
export const spotifyClient = new SpotifyClient();