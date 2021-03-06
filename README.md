﻿# flexiby-discord

## ℹ About the project
This is fairly simple Discord utility bot made for learning purposes. Goal of this mini project was to learn and understand the Discord [slash commands](https://discord.com/developers/docs/interactions/slash-commands) feature.

Bot is not maintained actively, nor do I recommend running it on a popular environment. You should only seek to use it for learning purposes.

## 📄 Bot features
Bot adds a new slash command `/new-temp-voice` which allows creating of temporary voice channels for your members. One member can only have one active temp voice channel at a time.

Channel is deleted once the creator uses `/new-temp-voice clear` command, or when channel has been empty for a while.

The creator can specify available voice slots while creating. Available options are: two, three, four, five, ten or unlimited.

## ⚙ Setting up the bot on your environment

### 1) Create a Discord bot application
Begin by creating a new Discord bot application at the [developer's portal](https://discord.com/developers/applications).

Once you've created the bot, invite it to your own server with this URL (replace the BOT_APPLICATION_ID):

```https://discord.com/api/oauth2/authorize?client_id=<BOT_APPLICATION_ID>&permissions=16778256&scope=applications.commands%20bot```

### 2) Setup local .env file
Create a new file named `.env` and replace it's contents with `API_KEY=YOUR_BOT_TOKEN`. You can check the `.env-sample` file for example.

### 3) Running the bot
Open your terminal and pass `npm start` to initialize the bot.
