import { Prisma, PrismaClient } from '@prisma/client';
import Topgg from '@top-gg/sdk';
import { Client, Collection, type ApplicationCommandData } from 'discord.js';
import glob from 'glob';
import LRU from 'lru-cache';
import type { Logger } from 'pino';

import { clientOptions, isProd } from '../constants.js';
import logger from '../utils/functions/logger.js';
import { createPrismaLRUCache } from '../utils/middleware/cacheMiddleware.js';
import { ClientUtils } from '../utils/structures/ClientUtils.js';
import type { ActiveUser } from './../typings';
import { BaseInteraction } from './BaseInteraction.js';
import { Command } from './Command.js';
import { Component } from './Component.js';
import { ContextMenu } from './ContextMenu.js';
import { Event } from './Event.js';

export class DotsimusClient<Ready extends boolean = boolean> extends Client<Ready> {
	protected cache: LRU<string, unknown>;

	activeUsers: ActiveUser[];
	interactions: Collection<string, BaseInteraction>;
	cooldowns: Collection<string, string>;
	logger: Logger;
	prisma: PrismaClient;
	utils: ClientUtils;
	topgg?: Topgg.Api;

	constructor() {
		super(clientOptions);

		this.cache = new LRU({ max: 500, ttl: 30 * 1000 });

		this.activeUsers = [];
		this.interactions = new Collection();
		this.cooldowns = new Collection();
		this.logger = logger;
		this.prisma = new PrismaClient();
		this.utils = new ClientUtils(this);
	}

	async handleEvents() {
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

	async handleInteractions() {
		if (!this.isReady()) throw new Error('Client not ready.');

		const commands: ApplicationCommandData[] = [];
		const files = glob.sync(`${isProd ? 'build' : 'src'}/{commands,components}/**/*.{js,ts}`);

		for (const file of files) {
			const interaction = await this.utils.importStructure<Command | Component | ContextMenu>(file);

			if (!interaction) continue;
			this.interactions.set(interaction.name, interaction);

			if (interaction instanceof Component) continue;
			commands.push(interaction.toJSON());
		}

		this.application.commands.set(commands);
	}

	async start(token?: string) {
		if (isProd) {
			if (!process.env.TOPGG_TOKEN) {
				throw new Error('Environment variable "TOPGG_TOKEN" is not defined.');
			}

			this.topgg = new Topgg.Api(process.env.TOPGG_TOKEN);
		}

		await this.prisma.$connect();

		const cacheMiddleware = createPrismaLRUCache({
			cache: this.cache,
			models: Object.values(Prisma.ModelName), // Cache all models
		});

		this.prisma.$use(cacheMiddleware);

		await this.handleEvents();
		await this.login(token);
	}
}
