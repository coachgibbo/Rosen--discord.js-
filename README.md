# Rosen-discord.js
A discord bot that integrates Youtube and Spotify to create a smart listening experience.

This bot was created for 3 main reasons
1. Discord took down YouTube music streaming bots
2. Keep similar songs playing without user input while gaming
3. Practice with javascript

## Features
- Commands
  - Play
    - Search for a song on YouTube, retrieve first result and stream it
    - Add to queue if something is playing
    - Retrieve song recommendations from Spotify and give user option to quick-add them to queue via buttons
  - Skip
    - Skip the currently playing song and start the next one
  - Queue
    - Retrieve the queue and send it as an embed
  - Join
    - Join command caller's voice channel
  - Leave
    - Leave current voice channel
- Music streaming from YouTube with queue system
- Embed builder for easily creating custom Discord Message Embeds
- 24/7 Uptime on Oracle Cloud with PM2

## To-Do
- Add automatic leave on inactivity
- Re-assess where I get music recommendations
- Create an embed music player with buttons
- Look into a database that stores songs played and generates recs from that
- Radio system
- Add photos to Github