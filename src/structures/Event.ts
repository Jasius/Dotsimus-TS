import type { ClientEvents } from 'discord.js';

import { DotsimusClient } from './DotsimusClient.js';

interface EventOptions {
	name: keyof ClientEvents;
	once?: boolean;
}

export abstract class Event implements EventOptions {
	client: DotsimusClient;
	name: keyof ClientEvents;
	once?: boolean;

	constructor(client: DotsimusClient, options: EventOptions) {
		this.client = client;
		this.name = options.name;
		this.once = options.once;
	}

	abstract execute(...args: any[]): void | Promise<void>;
}
