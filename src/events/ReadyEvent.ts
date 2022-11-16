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
        await this.client.refreshServerConfigCache();
        await client.handleInteractions();

        setInterval(() => {
            // Clears the `activeUsersCache` every 30 seconds
            client.activeUsersCache = client.activeUsersCache.filter(
                (activeUser) => Date.now() > activeUser.typingTimestamp + 30 * 1000
            );
        }, 30 * 1000);
    }
}
