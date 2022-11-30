import { ActivityType, Events } from 'discord.js';

import type { DotsimusClient } from '../structures/DotsimusClient';
import { Event } from '../structures/Event';

export default class ReadyEvent extends Event {
    constructor(client: DotsimusClient) {
        super(client, { name: Events.ClientReady, once: true });
    }

    async execute(client: DotsimusClient<true>) {
        client.logger.info(`Logged in as ${client.user.tag}.`);

        client.user.setActivity('Dotsimus.com', { type: ActivityType.Watching });

        await this.client.utils.refreshServerConfigs();
        await this.client.utils.refreshServerWatchKeywords();

        await client.handleInteractions();

        setInterval(() => {
            // Clears the `activeUsers` every 30 seconds
            client.activeUsers = client.activeUsers.filter(
                (activeUser) => Date.now() > activeUser.typingTimestamp + 30 * 1000
            );
        }, 30 * 1000);
    }
}
