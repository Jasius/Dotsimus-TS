import Topgg from '@top-gg/sdk';
import { ApplicationCommandData, Client, Collection } from 'discord.js';
import glob from 'glob';
import { Logger } from 'pino';

import { clientOptions } from '../constants';
import { ClientUtil } from '../utils/ClientUtil';
import logger from '../utils/logger';
import { isProd } from './../constants';
import { Command } from './Command';
import { Event } from './Event';

export class DotsimusClient<Ready extends boolean = boolean> extends Client<Ready> {
    commands: Collection<string, Command>;
    logger: Logger;
    topgg: Topgg.Api;
    util: ClientUtil;

    constructor() {
        super(clientOptions);

        this.commands = new Collection();
        this.logger = logger;
        this.topgg = new Topgg.Api(process.env.TOPGG_TOKEN!);
        this.util = new ClientUtil(this);
    }

    async handleEvents(): Promise<void> {
        const files = glob.sync(`${isProd ? 'dist' : 'src'}/events/**/*.{js,ts}`);

        for (const file of files) {
            const event = await this.util.importStructure<Event>(file);

            if (!event) continue;

            if (event.once) {
                this.once(event.name, (...args) => event.execute(...args));
            } else {
                this.on(event.name, (...args) => event.execute(...args));
            }
        }
    }

    async handleCommands(): Promise<void> {
        if (!this.isReady()) throw new Error('Client not ready.');

        const commands: ApplicationCommandData[] = [];
        const files = glob.sync(`${isProd ? 'dist' : 'src'}/commands/**/*.{js,ts}`);

        for (const file of files) {
            const command = await this.util.importStructure<Command>(file);

            if (!command) continue;

            this.commands.set(command.name, command);
            commands.push(command.toJSON());
        }

        this.application.commands.set(commands);
    }

    async start(token?: string): Promise<void> {
        await this.handleEvents();
        await this.login(token);
    }
}
