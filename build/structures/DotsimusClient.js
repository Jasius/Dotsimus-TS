import { Client, Collection } from 'discord.js';
import glob from 'glob';
import { clientOptions } from '../constants';
import { ClientUtil } from '../utils/ClientUtil';
import logger from '../utils/logger';
import { isProd } from '../constants';
export class DotsimusClient extends Client {
    commands;
    cooldowns;
    logger;
    topgg;
    util;
    constructor() {
        super(clientOptions);
        this.commands = new Collection();
        this.cooldowns = new Collection();
        this.logger = logger;
        this.topgg = undefined;
        this.util = new ClientUtil(this);
    }
    async handleEvents() {
        const files = glob.sync(`${isProd ? 'build' : 'src'}/events/**/*.{js,ts}`);
        for (const file of files) {
            const event = await this.util.importStructure(file);
            if (!event)
                continue;
            if (event.once) {
                this.once(event.name, (...args) => event.execute(...args));
            }
            else {
                this.on(event.name, (...args) => event.execute(...args));
            }
        }
    }
    async handleCommands() {
        if (!this.isReady())
            throw new Error('Client not ready.');
        const commands = [];
        const files = glob.sync(`${isProd ? 'build' : 'src'}/commands/**/*.{js,ts}`);
        for (const file of files) {
            const command = await this.util.importStructure(file);
            if (!command)
                continue;
            this.commands.set(command.name, command);
            commands.push(command.toJSON());
        }
        this.application.commands.set(commands);
    }
    async start(token) {
        await this.handleEvents();
        await this.login(token);
    }
}
