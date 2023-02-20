import { ActivityType, Events } from 'discord.js';

import { DotsimusClient } from '../structures/DotsimusClient.js';
import { Event } from '../structures/Event.js';

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
			// Removes inactive users every 30 seconds
			const filtered = client.activeUsers.filter((user) => user.typingTimestamp >= Date.now() - 30 * 1000);
			client.activeUsers = filtered;
		}, 30 * 1000);
	}
}
