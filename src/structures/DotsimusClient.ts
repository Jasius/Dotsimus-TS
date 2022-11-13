import { Client, GatewayIntentBits, Partials } from 'discord.js';

export class DotsimusClient extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.GuildMessageTyping,
                GatewayIntentBits.GuildPresences
            ],
            partials: [Partials.Channel]
        });

        // TODO: Add event handler
        this.on('ready', (c: Client<true>) => console.log(`Logged in as ${c.user.tag}.`));
    }

    async start(token?: string): Promise<void> {
        await this.login(token);
    }
}
