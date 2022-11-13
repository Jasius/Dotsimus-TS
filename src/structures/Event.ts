import { ClientEvents } from 'discord.js';

interface EventOptions {
    name: keyof ClientEvents;
    once?: boolean;
}

export abstract class Event implements EventOptions {
    name: keyof ClientEvents;
    once?: boolean;

    constructor(options: EventOptions) {
        this.name = options.name;
        this.once = options.once;
    }

    abstract execute(...args: any[]): Promise<any>;
}
