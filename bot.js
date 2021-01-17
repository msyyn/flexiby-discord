const Discord = require('discord.js');
require('dotenv').config();

/* 
  https://gist.github.com/advaith1/287e69c3347ef5165c0dbde00aa305d2
*/

// creating new client on startup
const client = new Discord.Client();
const client_token = process.env.API_KEY;
const default_private_channel_name = "Private voice channels";
const private_channel_lookup_keyword = "private voice";

// attach event listener for the ready event
client.on("ready", () => {
  console.log("Client is ready!");
  client.api.applications(client.user.id).guilds("800393416738603018").commands.post({data: {
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
        "description": "Create channel with ten four (4) slots.",
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
});

// receiving new interactions
client.ws.on('INTERACTION_CREATE', async interaction => {
  if (interaction.data.name !== "new-temp-voice") return;
  if (interaction.data.options[0].name === "clear") {
    clear_temp_channel(interaction.guild_id, interaction.channel_id, interaction.member, interaction.id, interaction.token)
  } else {
    generate_temp_channel(interaction.guild_id, interaction.channel_id, interaction.member, interaction.data.options[0].name, interaction.id, interaction.token);
  }
});

// generating temporary voice channels
generate_temp_channel = (guild_id, channel_id, member, voice_slots, interaction_id, interaction_token) => {
  const channel_name = `${member.user.username}#${member.user.discriminator}'s channel`; 
  let channel_options = {
    type: 'voice',
    userLimit: voice_slots,
    reason: `Requested by ${member.user.username}#${member.user.discriminator} (UID: ${member.user.id}) by using the interaction "new-temp-voice"`
  }

  client.guilds.fetch(guild_id).then((guild) => {
    // Search the guild for existing channels with USERNAME#DISC.
    const user_temp_channel = guild.channels.cache.find(a => a.type === "voice" && a.name == channel_name);
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
      channel_options.parent = private_category;
      guild.channels.create(channel_name, channel_options).then((channel) => {
        // TODO: Move user to channel  
        client.api.interactions(interaction_id, interaction_token).callback.post({data: {type: 4,  data: {content: `<@${member.user.id}>, you've created a new voice channel with ${voice_slots > 0 ? voice_slots : "∞"} user slots. **You will be automatically moved within 10 seconds.**`}}})
      });
    } else {
      // Create private category and then proceed creating user's temp channel
      guild.channels.create(default_private_channel_name, {type: "category"}).then((private_parent_category) => {
        channel_options.parent = private_parent_category;
        guild.channels.create(channel_name, channel_options).then((channel) => {
          // TODO: Move user to channel  
          client.api.interactions(interaction_id, interaction_token).callback.post({data: {type: 4,  data: {content: `<@${member.user.id}>, you've created a new voice channel with ${voice_slots > 0 ? voice_slots : "∞"} user slots. **You will be automatically moved within 10 seconds.**`}}})
        });
      });
    };
  });
};

// clearing temporary voice channels
clear_temp_channel = (guild_id, channel_id, member, interaction_id, interaction_token) => {
  const channel_name = `${member.user.username}#${member.user.discriminator}'s channel`; 

  client.guilds.fetch(guild_id).then((guild) => {
    // Search the guild for existing channels with USERNAME#DISC.
    const user_temp_channel = guild.channels.cache.find(a => a.type === "voice" && a.name == channel_name);

    // TODO notify members who got kicked from voice due channel removal??

    if (user_temp_channel) { user_temp_channel.delete() };
    client.api.interactions(interaction_id, interaction_token).callback.post({data: {type: 4,  data: {content: `<@${member.user.id}>, you've cleared your existing private channel.`}}})
  });
};

// login
client.login(client_token);