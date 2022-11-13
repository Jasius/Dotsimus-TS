import { ClientOptions, GatewayIntentBits, Partials } from 'discord.js';

export const clientOptions: ClientOptions = {
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
};

export const isProd = process.env.NODE_ENV === 'production';
