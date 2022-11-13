import { Events } from 'discord.js';
import { DotsimusClient } from '../structures/DotsimusClient';
import { Event } from '../structures/Event';

export default class ReadyEvent extends Event {
    constructor() {
        super({ name: Events.ClientReady, once: true });
    }

    async execute(client: DotsimusClient): Promise<any> {
        if (!client.isReady()) return;

        client.logger.info(`Logged in as ${client.user.tag}.`);
    }
}
