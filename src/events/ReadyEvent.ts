import { Events } from 'discord.js';
import { DotsimusClient } from '../structures/DotsimusClient';
import { Event } from '../structures/Event';

export default class ReadyEvent extends Event {
    constructor(client: DotsimusClient) {
        super(client, { name: Events.ClientReady, once: true });
    }

    async execute(client: DotsimusClient<true>): Promise<void> {
        await client.handleCommands();

        client.logger.info(`Logged in as ${client.user.tag}.`);
    }
}
