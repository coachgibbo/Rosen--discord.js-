# Rosen-discord.js
A discord bot that integrates Youtube and Spotify to create a smart listening experience.

This bot is for my own personal use after the big discord music bots got taken down. I'm
using this project to get a better feel for JS and to improve my skills working with
multiple API's at once. 

## Note on node version
ytdl has a major error in newer versions of node where it randomly crashes every
few minutes. As a result, I've switched the node version to v14.17.6 in production.
This is only a problem when deploying commands to a server, as it requires promise
handling only available in v16. For now, it's fine to just switch versions when
deploying commands.
