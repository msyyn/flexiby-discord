const Discord = require('discord.js');
require('dotenv').config(); // this allows reading of the .env file

// creating new client on startup
const client = new Discord.Client();
const client_token = process.env.API_KEY;
const default_private_channel_name = "Private voice channels";
const private_channel_lookup_keyword = "private voice";
const temp_channel_clear_interval = 15 * 60 * 1000 // Every 15 minutes

// attach event listener for the ready event
client.on("ready", () => {
  console.log(`Client is ready as ${client.user.tag}`);
  /* 
    Please see link below for global vs guild-specific commands and how they differ:
    https://gist.github.com/advaith1/287e69c3347ef5165c0dbde00aa305d2#global-commands
  */
  client.api.applications(client.user.id).commands.post({data: {
    name: 'new-temp-voice',
    description: 'Create a new channel temporarily available for provided amount of members',
    options: [
      {
        "name": "0",
        "description": "Create channel with unlimited (∞) user slots.",
        "type": 1
      },
      {
        "name": "2",
        "description": "Create channel with two (2) user slots.",
        "type": 1
      },
      {
        "name": "3",
        "description": "Create channel with three (3) user slots.",
        "type": 1
      },
      {
        "name": "4",
        "description": "Create channel with four (4) slots.",
        "type": 1
      },
      {
        "name": "5",
        "description": "Create channel with five (5) user slots.",
        "type": 1
      },
      {
        "name": "10",
        "description": "Create channel with ten (10) user slots.",
        "type": 1
      },
      {
        "name": "clear",
        "description": "Clear your current temporary channel.",
        "type": 1
      }
    ]
  }});
  setInterval(periodic_clear_channels, temp_channel_clear_interval);
});

// receiving new interactions
client.ws.on('INTERACTION_CREATE', async interaction => {
  if (interaction.data.name !== "new-temp-voice") return;
  if (interaction.data.options[0].name === "clear") {
    clear_temp_channel(interaction.guild_id, interaction.member, interaction.id, interaction.token)
  } else {
    generate_temp_channel(interaction.guild_id, interaction.channel_id, interaction.member, interaction.data.options[0].name, interaction.id, interaction.token);
  }
});

// generating temporary voice channels
generate_temp_channel = async (guild_id, channel_id, member, voice_slots, interaction_id, interaction_token) => {
  const channel_name = `${member.user.username}#${member.user.discriminator}'s channel`; 
  let channel_options = {
    type: 'voice',
    userLimit: voice_slots,
    reason: `Requested by ${member.user.username}#${member.user.discriminator} (UID: ${member.user.id}) by using the interaction "new-temp-voice"`
  }

  try {
    const guild = await client.guilds.fetch(guild_id);
    const user_temp_channel = guild.channels.cache.find(a => a.type === "voice" && a.name == channel_name); // Search the guild for existing channel by the member.

    if (user_temp_channel) {
      // TODO: Edit so that if new limit > current limit, update the limit of current channel.
      // Otherwise ask user to clear current one first.
      client.api.interactions(interaction_id, interaction_token).callback.post({data: {type: 4,  data: {content: `<@${member.user.id}>, you already have a existing channel. Use \`/new-temp-voice clear\` to delete previous one and try again.`}}})
      return;
    }

    // Check if there is "Private voice" category already
    const private_category = guild.channels.cache.find(a => a.type === "category" && a.name.toLowerCase().includes(private_channel_lookup_keyword));
    if (private_category) {
      // Create a temp channel channel under existing private category
      try {
        channel_options.parent = private_category;
        const channel = await guild.channels.create(channel_name, channel_options);

        // Notify user about creation
        client.api.interactions(interaction_id, interaction_token).callback.post({data: {type: 4,  data: {content: `<@${member.user.id}>, you've created a new voice channel with ${voice_slots > 0 ? voice_slots : "∞"} user slots. **You will be automatically moved within few seconds if you're already in another voice channel.**`}}});

        // If user is on another voice channel we can move them to new channel.
        const discord_member = await guild.members.fetch(member.user.id);
        if (discord_member.voice.channelID) {discord_member.voice.setChannel(channel, channel_options.reason)};
      } catch(error) {
        console.log(error)
      };
    } else {
      // Create private category and then proceed creating user's temp channel
      try {
        const private_parent_category = await guild.channels.create(default_private_channel_name, {type: "category"});
        channel_options.parent = private_parent_category;
        const channel = await guild.channels.create(channel_name, channel_options);

        // Notify user about creation
        client.api.interactions(interaction_id, interaction_token).callback.post({data: {type: 4,  data: {content: `<@${member.user.id}>, you've created a new voice channel with ${voice_slots > 0 ? voice_slots : "∞"} user slots. **You will be automatically moved within few seconds if you're already in another voice channel.**`}}});

        // If user is on another voice channel we can move them to new channel.
        const discord_member = await guild.members.fetch(member.user.id);
        if (discord_member.voice.channelID) {discord_member.voice.setChannel(channel, channel_options.reason)};
      } catch (error) {
        console.log(error);
      }
    };
  } catch (error){
    console.log(error);
  }
};

// clearing temporary voice channels
clear_temp_channel = async (guild_id, member, interaction_id, interaction_token) => {
  try {
    const channel_name = `${member.user.username}#${member.user.discriminator}'s channel`; 
    const guild = await client.guilds.fetch(guild_id);

    // Search the guild for existing channels with USERNAME#DISC.
    const user_temp_channel = guild.channels.cache.find(a => a.type === "voice" && a.name == channel_name);

    // TODO notify members who got kicked from voice due channel removal??

    if (user_temp_channel) { user_temp_channel.delete() };
    if (interaction_id && interaction_token) {
      client.api.interactions(interaction_id, interaction_token).callback.post({data: {type: 4,  data: {content: `<@${member.user.id}>, you've cleared your existing private channel.`}}})
    };
  } catch (error) {
    console.log(error);
  };
};

// periodic clearing for temporary voice channels
periodic_clear_channels = () => {
  let channels_cleared = 0;
  const regex = /(.+?)#\d{4}/; // This regex matches the Discord username#discriminator combination, e.g. mika#3184
  const temp_channels = client.channels.cache.filter(a => a.type === "voice" && a.name.match(regex));
  if (Array.from(temp_channels).length === 0) { return };

  // Clear every channel individually
  temp_channels.forEach(cached_channel => {
    const resolved_channel = client.channels.resolve(cached_channel);
    if (Array.from(resolved_channel.members).length == 0) {resolved_channel.delete(); channels_cleared++};
  });

  console.log(`Periodic cleaner removed ${channels_cleared} temporary channels.`);
};

// login
client.login(client_token);