import { ActivityType, Events } from 'discord.js';

import { DotsimusClient } from '../structures/DotsimusClient';
import { Event } from '../structures/Event';

export default class ReadyEvent extends Event {
    constructor(client: DotsimusClient) {
        super(client, { name: Events.ClientReady, once: true });
    }

    async execute(client: DotsimusClient<true>): Promise<void> {
        client.logger.info(`Logged in as ${client.user.tag}.`);

        client.user.setActivity('Dotsimus.com', { type: ActivityType.Watching });

        await client.handleCommands();
    }
}
