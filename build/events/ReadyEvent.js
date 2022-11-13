import { ActivityType, Events } from 'discord.js';
import { Event } from '../structures/Event';
export default class ReadyEvent extends Event {
    constructor(client) {
        super(client, { name: Events.ClientReady, once: true });
    }
    async execute(client) {
        client.logger.info(`Logged in as ${client.user.tag}.`);
        client.user.setActivity(`Dotsimus.com`, { type: ActivityType.Watching });
        await client.handleCommands();
    }
}
