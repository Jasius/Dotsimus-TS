import { Client } from 'discord.js';
import glob from 'glob';
import { Logger } from 'pino';

import { clientOptions } from '../constants';
import { ClientUtil } from '../utils/ClientUtil';
import logger from '../utils/logger';
import { isProd } from './../constants';
import { Event } from './Event';

export class DotsimusClient extends Client {
    logger: Logger;
    util: ClientUtil;

    constructor() {
        super(clientOptions);

        this.logger = logger;
        this.util = new ClientUtil(this);
    }

    async handleEvents(): Promise<void> {
        const files = glob.sync(`${isProd ? 'dist' : 'src'}/events/**/*.{js,ts}`);

        for (const file of files) {
            const event = await this.util.importStructure<Event>(file);

            if (!event) continue;

            if (event.once) {
                this.once(event.name, event.execute.bind(null, this));
            } else {
                this.on(event.name, event.execute.bind(null, this));
            }
        }
    }

    async start(token?: string): Promise<void> {
        await this.handleEvents();
        await this.login(token);
    }
}
