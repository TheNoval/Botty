import { Client, Events, SlashCommandBuilder, GatewayIntentBits, Partials, ChannelType } from 'discord.js';
import { readFile } from "fs/promises";
import { aiPrompt } from './api_code.js';

// Read and parse JSON file
const config = JSON.parse(
  await readFile(new URL("./config.json", import.meta.url))
);

const discordToken = config.discordToken;
const p_channel = config.channel;
const p_roles = config.roles;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages
  ],
  partials: [
    Partials.Message,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember,
    Partials.ThreadMember,
    Partials.Channel
  ]
});


client.once(Events.ClientReady, c => {
  console.log(`logged in as ${c.user.username}`)
});


client.on(Events.InteractionCreate, interaction => {
  if (!interaction.isCommand()) return;
  const {commandName} = interaction;

  if (commandName === 'ping') {
    interaction.reply('Pong!');
  }
})


client.on(Events.MessageCreate, (message) => {
  if (message.author.bot) return; // Ignore messages from bots

  if (message.content.toLowerCase().includes("ping")) {
      message.channel.send("Pong!");
  }
});

const conversation =  { messages: [] };
client.on(Events.MessageCreate, async (message) => {
  console.log(`Message received: ${message.content}`);

  if (message.author.bot) return;
  if (message.channelId !== p_channel.botChannelID && message.channelId !== p_channel.setupChannelID) return;

  const member = await message.guild.members.fetch(message.author.id);
  const displayName = member.nickname || member.user.globalName;

  // Add the new user message to the history
  conversation.messages.push({ role: 'user', content: displayName + ": " + message.content });

  // Call the aiPrompt with the full conversation history
  const response = await aiPrompt(conversation.messages);

  // Add the bot's response to the conversation history
  conversation.messages.push({ role: 'assistant', content: response.choices[0].message.content });

  message.reply(response.choices[0].message.content);
  // console.dir(conversation, { depth: null });

  console.log(conversation.messages.length);
  if (conversation.messages.length === 30) {
    conversation.messages = conversation.messages.slice(2);
  }
});

client.on(Events.MessageCreate, (message) => {
  if (message.author.bot) return;
  if (message.channel.type === 1) {  // 1 = DM Channel
      console.log(`DM from ${message.author.tag}: ${message.content}`);
      message.channel.send('Hello! I received your DM.');
  }
});

client.on(Events.GuildMemberAdd, (member) => {
  if (!member.guild) return;

  const role = member.guild.roles.cache.get(p_roles.defaultRoleID);
  const bot = member.guild.roles.cache.get(p_roles.botRoleID);
  if (!role) return console.error("Role not found!");
  if (!bot) return console.error("Bot role not found!");

  if (member.user.bot) {
      member.roles.add(bot);
  } else {
      member.roles.add(role);
  }
});

client.login(discordToken)