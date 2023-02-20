import { ChannelType, Events, Typing } from 'discord.js';

import { DotsimusClient } from '../structures/DotsimusClient.js';
import { Event } from '../structures/Event.js';

export default class TypingStartEvent extends Event {
	constructor(client: DotsimusClient) {
		super(client, { name: Events.TypingStart });
	}

	async execute({ channel, user }: Typing) {
		if (channel.type === ChannelType.DM) return;

		this.client.activeUsers.push({
			userId: user.id,
			guildId: channel.guild.id,
			typingTimestamp: Date.now(),
		});
	}
}
