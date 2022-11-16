import { PrismaClient, type Prisma } from '@prisma/client';

export class PrismaUtils {
    client: PrismaClient;

    constructor() {
        this.client = new PrismaClient();
    }

    async getServerConfig(serverId: string) {
        return await this.client.serversConfig.findUnique({ where: { serverId: serverId } });
    }

    async saveServerConfig(serverId: string, serverConfig: Prisma.ServersConfigCreateInput) {
        return await this.client.serversConfig.upsert({
            create: serverConfig,
            update: serverConfig,
            where: { serverId }
        });
    }

    async getServerWatchedKeywords(serverId: string) {
        return await this.client.watchKeyword.findMany({ where: { serverId } });
    }

    async getUserWatchedKeywords(userId: string, serverId: string) {
        return await this.client.watchKeyword.findUnique({ where: { userId_serverId: { userId, serverId } } });
    }

    async saveWatchedKeywords(userId: string, serverId: string, watchedWords: string[]) {
        const guildWatchedKeywords = await this.getServerWatchedKeywords(serverId);
        const userWatchedKeywords = guildWatchedKeywords.find((keywords) => keywords.userId === userId);

        if (userWatchedKeywords) watchedWords.push(...userWatchedKeywords.watchedWords);

        watchedWords = [...new Set(watchedWords)];

        return await this.client.watchKeyword.upsert({
            create: { userId, serverId, watchedWords },
            update: { userId, serverId, watchedWords },
            where: { userId_serverId: { userId, serverId } }
        });
    }

    async removeWatchedKeywords(userId: string, serverId: string, watchedWords?: string[]) {
        const watchedKeywords = await this.getUserWatchedKeywords(userId, serverId);

        if (!watchedKeywords) return null;

        let difference = watchedKeywords.watchedWords.filter((word) => !watchedWords?.includes(word));
        difference = [...new Set(difference)];

        return await this.client.watchKeyword.update({
            data: { userId, serverId, watchedWords: watchedWords ? difference : [] },
            where: { userId_serverId: { userId, serverId } }
        });
    }
}
