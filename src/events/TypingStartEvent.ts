import { ChannelType, Events, type Typing } from 'discord.js';

import type { DotsimusClient } from '../structures/DotsimusClient';
import { Event } from '../structures/Event';

export default class TypingStartEvent extends Event {
    constructor(client: DotsimusClient) {
        super(client, { name: Events.TypingStart });
    }

    async execute({ channel, user }: Typing) {
        if (channel.type === ChannelType.DM) return;

        this.client.activeUsersCache.push({
            userId: user.id,
            guildId: channel.guild.id,
            typingTimestamp: Date.now()
        });
    }
}
