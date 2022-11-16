import type { ServersConfig } from '@prisma/client';
import Topgg from '@top-gg/sdk';
import { Client, Collection, type ApplicationCommandData } from 'discord.js';
import glob from 'glob';
import type { Logger } from 'pino';

import { clientOptions, isProd } from '../constants';
import { ClientUtils } from '../utils/ClientUtils';
import logger from '../utils/logger';
import { PrismaUtils } from '../utils/PrismaUtils';
import type { ActiveUser } from './../typings';
import { Command } from './Command';
import { Component } from './Component';
import { ContextMenu } from './ContextMenu';
import type { Event } from './Event';

export class DotsimusClient<Ready extends boolean = boolean> extends Client<Ready> {
    commands: Collection<string, Command>;
    components: Collection<string, Component>;
    contextMenus: Collection<string, ContextMenu>;
    cooldowns: Collection<string, string>;
    logger: Logger;
    prisma: PrismaUtils;
    utils: ClientUtils;
    topgg?: Topgg.Api;

    // Caching
    activeUsersCache: ActiveUser[];
    serversConfigCache: Collection<string, ServersConfig>;

    constructor() {
        super(clientOptions);

        this.commands = new Collection();
        this.components = new Collection();
        this.contextMenus = new Collection();
        this.cooldowns = new Collection();
        this.logger = logger;
        this.prisma = new PrismaUtils();
        this.utils = new ClientUtils(this);
        this.activeUsersCache = [];
        this.serversConfigCache = new Collection();
    }

    async handleEvents(): Promise<void> {
        const files = glob.sync(`${isProd ? 'build' : 'src'}/events/**/*.{js,ts}`);

        for (const file of files) {
            const event = await this.utils.importStructure<Event>(file);

            if (!event) continue;

            if (event.once) {
                this.once(event.name, (...args) => event.execute(...args));
            } else {
                this.on(event.name, (...args) => event.execute(...args));
            }
        }
    }

    async handleInteractions(): Promise<void> {
        if (!this.isReady()) throw new Error('Client not ready.');

        const commands: ApplicationCommandData[] = [];
        const files = glob.sync(`${isProd ? 'build' : 'src'}/{commands,components}/**/*.{js,ts}`);

        for (const file of files) {
            const interaction = await this.utils.importStructure<Command | Component | ContextMenu>(file);

            if (!interaction) continue;

            if (interaction instanceof Command) this.commands.set(interaction.name, interaction);
            else if (interaction instanceof ContextMenu) this.contextMenus.set(interaction.name, interaction);
            else if (interaction instanceof Component) {
                this.components.set(interaction.name, interaction);
                continue;
            }

            commands.push(interaction.toJSON());
        }

        this.application.commands.set(commands);
    }

    async refreshServerConfigCache() {
        for (const [guildId, guild] of this.guilds.cache) {
            const me = await guild.members.fetchMe();

            const serverConfig = await this.prisma.saveServerConfig(guildId, {
                joinDate: me.joinedTimestamp ?? Date.now(),
                serverId: guildId,
                serverName: guild.name,
                memberCount: guild.memberCount
            });

            this.serversConfigCache.set(guildId, serverConfig);
        }
    }

    async start(token?: string): Promise<void> {
        if (isProd && process.env.TOPGG_TOKEN) {
            this.topgg = new Topgg.Api(process.env.TOPGG_TOKEN);
        } else if (isProd && !process.env.TOPGG_TOKEN) {
            throw new Error('Missing TOPGG_TOKEN in production.');
        }

        await this.prisma.client.$connect();
        await this.handleEvents();
        await this.login(token);
    }
}
