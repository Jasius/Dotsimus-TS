import path from 'node:path';

import { MentionType, Message, Prisma } from '@prisma/client';
import { ColorResolvable, Guild } from 'discord.js';

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

	saveAlert(serverId: string, mention: Prisma.MentionCreateInput, threshold: number, channelId: string) {
		const alertConfig: Prisma.AlertCreateInput = {
			serverId,
			channelId,
			mention,
			threshold,
		};

		return this.client.prisma.alert.upsert({
			create: alertConfig,
			update: alertConfig,
			where: { serverId },
		});
	}

	getAlert(serverId: string) {
		return this.client.prisma.alert.findUnique({ where: { serverId } });
	}

	deleteAlert(serverId: string) {
		return this.client.prisma.alert.delete({ where: { serverId } });
	}

	getInfractions(userId: string, serverId: string) {
		return this.client.prisma.userInfractions.findMany({ where: { userId, serverId } });
	}

	saveInfraction(input: Prisma.UserInfractionsCreateInput) {
		return this.client.prisma.userInfractions.upsert({
			create: input,
			update: input,
			where: { userId_serverId: { userId: input.userId, serverId: input.serverId } },
		});
	}

	getServerConfig(serverId: string) {
		return this.client.prisma.serversConfig.findUnique({ where: { serverId } });
	}

	saveServerConfig({ id, members, memberCount, name }: Guild) {
		const me = members.me;
		const serverConfig: Prisma.ServersConfigCreateInput = {
			joinDate: me?.joinedTimestamp ?? Date.now(),
			serverId: id,
			serverName: name,
			memberCount,
		};

		return this.client.prisma.serversConfig.upsert({
			create: serverConfig,
			update: serverConfig,
			where: { serverId: id },
		});
	}

	getWatchedKeywords(userId: string, serverId: string) {
		return this.client.prisma.watchKeyword.findUnique({ where: { userId_serverId: { userId, serverId } } });
	}

	getServerWatchedKeywords(serverId: string) {
		return this.client.prisma.watchKeyword.findMany({ where: { serverId } });
	}

	async saveWatchedKeywords(userId: string, serverId: string, watchedWords: string[]) {
		const watchedKeywords = await this.getWatchedKeywords(userId, serverId);
		let combinedWords = watchedWords;

		if (watchedKeywords) combinedWords.push(...watchedKeywords.watchedWords);
		combinedWords = [...new Set(combinedWords)];

		return this.client.prisma.watchKeyword.upsert({
			create: { userId, serverId, watchedWords: combinedWords },
			update: { userId, serverId, watchedWords: combinedWords },
			where: { userId_serverId: { userId, serverId } },
		});
	}

	async deleteWatchedKeywords(userId: string, serverId: string, watchedWords?: string[]) {
		const watchedKeywords = await this.getWatchedKeywords(userId, serverId);

		let difference = watchedKeywords?.watchedWords.filter((word) => !watchedWords?.includes(word));
		difference = [...new Set(difference)];

		return this.client.prisma.watchKeyword.update({
			data: { userId, serverId, watchedWords: watchedWords ? difference : [] },
			where: { userId_serverId: { userId, serverId } },
		});
	}

	async refreshServerConfigs() {
		for (const [, guild] of this.client.guilds.cache) {
			await this.saveServerConfig(guild);
		}
	}

	async refreshServerWatchKeywords() {
		for (const [guildId] of this.client.guilds.cache) {
			await this.getServerWatchedKeywords(guildId);
		}
	}
}
