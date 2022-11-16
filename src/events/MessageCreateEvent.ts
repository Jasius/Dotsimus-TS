import {
    ChannelType,
    EmbedBuilder,
    Events,
    PermissionFlagsBits,
    userMention,
    type GuildTextBasedChannel,
    type Message
} from 'discord.js';

import type { DotsimusClient } from '../structures/DotsimusClient';
import { Event } from '../structures/Event';

export default class MessageCreateEvent extends Event {
    constructor(client: DotsimusClient) {
        super(client, { name: Events.MessageCreate });
    }

    async execute(message: Message) {
        if (message.author.bot) return;

        if (message.channel.type === ChannelType.DM) {
            // TODO: Do the funny Jaska talking thing
            return;
        }

        if (!message.guild) return;

        if (!this.client.serversConfigCache.has(message.guild.id)) await this.client.refreshServerConfigCache();

        const serverConfig = this.client.serversConfigCache.get(message.guild.id);
        const guildWatchedKeywords = await this.client.prisma.getServerWatchedKeywords(message.guild.id);

        for (const watchedKeywords of guildWatchedKeywords) {
            const server = {
                name: message.guild.name,
                id: message.guild.id,
                prefix: serverConfig?.prefix ?? '!',
                isSubscribed: !!serverConfig?.isSubscribed
            };

            const triggeredKeywords: string[] = [];
            const isWatcherActive = !!this.client.activeUsersCache.find(
                (activeUser) => activeUser.userId === watchedKeywords.userId && activeUser.guildId === server.id
            );

            for (const word of watchedKeywords.watchedWords) {
                if (message.content.toLowerCase().includes(word)) triggeredKeywords.push(word);
            }

            if (triggeredKeywords.length)
                this.client.users.fetch(watchedKeywords.userId).then(async (user) => {
                    if (!message.guild?.members.cache.get(watchedKeywords.userId)) {
                        await this.client.prisma.removeWatchedKeywords(watchedKeywords.userId, server.id);
                    } else {
                        try {
                            const watchedKeywordsMember = await message.guild.members.fetch(watchedKeywords.userId);

                            if (
                                watchedKeywordsMember.id === message.author.id ||
                                isWatcherActive ||
                                !watchedKeywordsMember.permissions.has(PermissionFlagsBits.ViewChannel)
                            )
                                return;

                            const trackingNotice = new EmbedBuilder()
                                .setTitle(`❗ Tracked keyword(s) "${triggeredKeywords.join('", "')}" triggered`)
                                .setDescription(message.content)
                                .addFields(
                                    {
                                        name: 'Message Author',
                                        value: userMention(message.author.id),
                                        inline: true
                                    },
                                    { name: 'Author ID', value: message.author.id, inline: true },
                                    {
                                        name: 'Channel',
                                        value: `${server.name}/${
                                            (message.channel as GuildTextBasedChannel).name
                                        } | 🔗 [Message link](${message.url})`
                                    }
                                )
                                .setThumbnail(message.author.displayAvatarURL())
                                .setFooter({
                                    text: `Stop tracking with /watch remove command in ${server.name} server.`
                                })
                                .setColor(
                                    this.client.utils.getRandomColor(
                                        message.member?.displayName ?? message.author.username
                                    )
                                );

                            try {
                                await user.send({ embeds: [trackingNotice] });
                            } catch {
                                await this.client.prisma.removeWatchedKeywords(watchedKeywords.userId, server.id);
                            }
                        } catch (error) {
                            this.client.logger.error({
                                author: message.author.id,
                                message: message.content,
                                watcher: watchedKeywords.userId,
                                server: server.id,
                                error
                            });
                        }
                    }
                });
        }
    }
}
