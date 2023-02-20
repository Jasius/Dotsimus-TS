import path from 'node:path';

import { Prisma } from '@prisma/client';
import { ColorResolvable } from 'discord.js';

import { Command } from '../../structures/Command.js';
import { Component } from '../../structures/Component.js';
import { ContextMenu } from '../../structures/ContextMenu.js';
import { DotsimusClient } from '../../structures/DotsimusClient.js';
import { Event } from '../../structures/Event.js';

export class ClientUtils {
	client: DotsimusClient;

	constructor(client: DotsimusClient) {
		this.client = client;
	}

	async importStructure<T extends Command | Component | ContextMenu | Event>(file: string): Promise<T | null> {
		try {
			const filePath = path.resolve(process.cwd(), file);
			const fileURL = new URL('file:///' + filePath);
			const File = (await import(fileURL.href)).default;

			return new File(this.client);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.client.logger.error(`${file.split('/').pop()}: ${message}`);

			return null;
		}
	}

	getRandomColor(input: string): ColorResolvable {
		const h = [...input].reduce((acc, char) => {
				return char.charCodeAt(0) + ((acc << 5) - acc);
			}, 0),
			s = 95,
			l = 35 / 100,
			a = (s * Math.min(l, 1 - l)) / 100,
			f = (n: number) => {
				const k = (n + h / 30) % 12,
					color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
				return Math.round(255 * color)
					.toString(16)
					.padStart(2, '0');
			};
		return `#${f(0)}${f(8)}${f(4)}`;
	}

	getServerConfig(serverId: string) {
		return this.client.prisma.serversConfig.findUnique({ where: { serverId } });
	}

	setServerConfig(serverId: string, serverConfig: Prisma.ServersConfigCreateInput) {
		return this.client.prisma.serversConfig.upsert({
			create: serverConfig,
			update: serverConfig,
			where: { serverId },
		});
	}

	getServerWatchedKeywords(serverId: string) {
		return this.client.prisma.watchKeyword.findMany({ where: { serverId } });
	}

	getUserWatchedKeywords(userId: string, serverId: string) {
		return this.client.prisma.watchKeyword.findUnique({ where: { userId_serverId: { userId, serverId } } });
	}

	async setWatchedKeywords(userId: string, serverId: string, watchedWords: string[]) {
		const watchedKeywords = await this.getUserWatchedKeywords(userId, serverId);

		if (watchedKeywords) watchedWords.push(...watchedKeywords.watchedWords);

		watchedWords = [...new Set(watchedWords)];

		return this.client.prisma.watchKeyword.upsert({
			create: { userId, serverId, watchedWords },
			update: { userId, serverId, watchedWords },
			where: { userId_serverId: { userId, serverId } },
		});
	}

	async deleteWatchedKeywords(userId: string, serverId: string, watchedWords?: string[]) {
		const watchedKeywords = await this.getUserWatchedKeywords(userId, serverId);

		let difference = watchedKeywords?.watchedWords.filter((word) => !watchedWords?.includes(word));
		difference = [...new Set(difference)];

		return this.client.prisma.watchKeyword.update({
			data: { userId, serverId, watchedWords: watchedWords ? difference : [] },
			where: { userId_serverId: { userId, serverId } },
		});
	}

	async refreshServerConfigs() {
		for (const [guildId, guild] of this.client.guilds.cache) {
			const me = await guild.members.fetchMe();
			await this.setServerConfig(guildId, {
				joinDate: me.joinedTimestamp ?? Date.now(),
				serverId: guildId,
				serverName: guild.name,
				memberCount: guild.memberCount,
			});
		}
	}

	async refreshServerWatchKeywords() {
		for (const [guildId] of this.client.guilds.cache) {
			await this.getServerWatchedKeywords(guildId);
		}
	}
}
