import {
	ActionRowBuilder,
	ChannelType,
	EmbedBuilder,
	Events,
	GuildMember,
	Message,
	PermissionFlagsBits,
	StringSelectMenuBuilder,
	TextChannel,
	ThreadChannel,
	userMention,
} from 'discord.js';

import { Collection } from 'discord.js';
import { getToxicity } from '../api/perspective.js';
import { isProd } from '../constants.js';
import { DotsimusClient } from '../structures/DotsimusClient.js';
import { Event } from '../structures/Event.js';
import { AnalyzedMessage } from './../typings/index.d';

export default class MessageCreateEvent extends Event {
	constructor(client: DotsimusClient) {
		super(client, { name: Events.MessageCreate });
	}

	async execute(message: Message) {
		if (message.author.bot) return;

		if (message.channel.type === ChannelType.DM) {
			if (message.author.id === process.env.OWNER && message.reference?.messageId) {
				const ref = await message.channel.messages.fetch(message.reference.messageId);
				try {
					await this.client.users.cache.get(ref.content.split(/ +/g)[0])?.send(message.content);
				} catch (error) {
					this.client.logger.error(error);
					await this.client.users.cache.get(process.env.OWNER!)?.send(`❌ Failed to send the message.`);
				}
				return;
			} else {
				try {
					await this.client.users.cache
						.get(process.env.OWNER!)
						?.send(
							`${message.author.id} ${message.author.username}#${message.author.discriminator} \n${message.content}`,
						);
				} catch (error) {
					this.client.logger.error(error);
				}
			}
		}

		if (!message.inGuild() || !message.member) return;

		try {
			const serverConfig =
				(await this.client.utils.getServerConfig(message.guild.id)) ??
				(await this.client.utils.saveServerConfig(message.guild));

			const serverWatchedKeywords = await this.client.utils.getServerWatchedKeywords(message.guild.id);
			for (const watchedKeywords of serverWatchedKeywords) {
				if (watchedKeywords.userId === message.author.id) continue;

				const triggerWords: string[] = [];
				const activeWatcher = this.client.activeUsers.find((user) => {
					return user.userId === watchedKeywords.userId && user.guildId === message.guild.id;
				});

				if (activeWatcher) continue;

				const watcher = await message.guild.members.fetch(watchedKeywords.userId);
				if (!watcher.permissions.has(PermissionFlagsBits.ViewChannel)) continue;

				for (const word of watchedKeywords.watchedWords) {
					if (message.content.toLowerCase().includes(word)) triggerWords.push(word);
				}

				if (!triggerWords.length) continue;

				if (!message.guild.members.cache.get(watchedKeywords.userId)) {
					await this.client.utils.deleteWatchedKeywords(watchedKeywords.userId, serverConfig.id);
					continue;
				}

				const trackingEmbed = new EmbedBuilder()
					.setTitle(`❗ Tracked keyword(s) "${triggerWords.join('", "')}" triggered`)
					.setDescription(message.content)
					.addFields(
						{
							name: 'Message Author',
							value: userMention(message.author.id),
							inline: true,
						},
						{ name: 'Author ID', value: message.author.id, inline: true },
						{
							name: 'Channel',
							value: `${message.guild.name}/${message.channel.name} | 🔗 [Message link](${message.url})`,
						},
					)
					.setThumbnail(message.author.displayAvatarURL())
					.setFooter({
						text: `Stop tracking with /watch remove command in ${message.guild.name} server.`,
					})
					.setColor(this.client.utils.getRandomColor(message.member?.displayName ?? message.author.username));

				try {
					await watcher.user.send({ embeds: [trackingEmbed] });
				} catch (error) {
					await this.client.utils.deleteWatchedKeywords(watchedKeywords.userId, serverConfig.id);
				}
			}

			const user = {
				isAdmin: message.member.permissions.has(PermissionFlagsBits.Administrator),
				isModerator:
					message.member.permissions.has(PermissionFlagsBits.KickMembers) ||
					message.member.permissions.has(PermissionFlagsBits.BanMembers),
				isNew: Math.round(Date.now() - (message.member.joinedTimestamp ?? 0)) / (1000 * 60 * 60 * 24) <= 7,
				isRegular: Math.round(Date.now() - (message.member.joinedTimestamp ?? 0)) / (1000 * 60 * 60 * 24) >= 30,
			};

			if ((!serverConfig.isSubscribed && isProd) || (user.isModerator && isProd)) return;

			const { toxicity, insult, combined, isSupportedLanguage } = await getToxicity(message.cleanContent, false);

			if (!isSupportedLanguage) return;

			const createAlerts = async (messages: AnalyzedMessage[]) => {
				const infractionCount = await this.client.utils
					.getInfractions(message.author.id, message.guild.id)
					.then((i) => i.length);

				const alert = await this.client.utils.getAlert(message.guild.id);

				if (!alert) return;

				const removedContent = message.content;
				const removedAttachments = message.attachments;

				await message.delete();

				const role = await message.guild.roles.fetch(alert.mention.id);
				const channel = await message.guild.channels.fetch(alert.channelId).then((channel) => channel as TextChannel);

				if (role) {
					await message.member?.roles.add(role);
				}

				const infractionMessage = await message.channel.send(
					role
						? 'Message has been flagged for review, awaiting moderation response.'
						: 'Message has been flagged for review, ⚠️ user is not muted.',
				);

				if (channel && channel.isTextBased()) {
					const investigationEmbed = new EmbedBuilder({ color: 0xffbd2e })
						.setAuthor({ name: 'Alert type: Toxicity' })
						.setTitle("🔎 Investigate user's message")
						.addFields({
							name: `Trigger message (Toxicity: ${Math.round(toxicity * 100)}%, Insult: ${Math.round(insult * 100)}%)`,
							value:
								removedContent.length > 1024
									? removedContent.slice(0, 1021).padEnd(1024, '.')
									: removedContent || 'No recent message found.',
							inline: false,
						})
						.setFooter({ text: `${message.channel.id} ${infractionMessage.id}` });

					const attachmentEmbeds: EmbedBuilder[] = [];
					for (const { id, name, url } of removedAttachments.values()) {
						let embed = new EmbedBuilder({ color: 0xffbd2e })
							.setTitle(`Trigger attachment: ${name}`)
							.setImage(url)
							.setFooter({ text: `${attachmentEmbeds.length + 1}  •  Attachment ID: ${id}` });

						attachmentEmbeds.push(embed);
					}

					// TODO: Handle
					const reportActions = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
						new StringSelectMenuBuilder()
							.setCustomId('investigationDropdown')
							.setPlaceholder('Choose investigation action')
							.addOptions([
								{
									label: 'Mute & approve report',
									description: 'User stays muted, their message removed, adds infraction.',
									value: 'reportApprovalAction',
									emoji: '✅',
								},
								{
									label: 'Unmute & approve report',
									description: 'User gets unmuted, their message removed, infraction added.',
									value: 'reportApprovalUnmuteAction',
									emoji: '☑️',
								},
								{
									label: 'Unmute & reject report',
									description: 'User gets unmuted, their message reinstated.',
									value: 'reportRejectionAction',
									emoji: '❌',
								},
								{
									label: 'Ban & approve report',
									description: 'User gets banned, their message removed, infraction added.',
									value: 'reportApprovalBanAction',
									emoji: '🔨',
								},
							]),
					);

					if (messages[1]) {
						const { toxicity, insult } = messages[1].attributeScores;

						investigationEmbed.addFields({
							name: `Second message (Toxicity: ${Math.round(toxicity * 100)}%, Insult: ${Math.round(insult * 100)}%)`,
							value:
								messages[1].content.length > 1024
									? messages[1].content.slice(0, 1021).padEnd(1024, '.')
									: messages[1].content,
							inline: false,
						});
					}

					if (messages[2]) {
						const { toxicity, insult } = messages[2].attributeScores;

						investigationEmbed.addFields({
							name: `Third message (Toxicity: ${Math.round(toxicity * 100)}%, Insult: ${Math.round(insult * 100)}%)`,
							value:
								messages[2].content.length > 1024
									? messages[2].content.slice(0, 1021).padEnd(1024, '.')
									: messages[2].content,
							inline: false,
						});
					}

					investigationEmbed.addFields(
						{ name: 'User', value: `<@${message.author.id}>`, inline: true },
						{ name: 'User ID', value: `${message.author.id}`, inline: true },
						{ name: 'Is user new?', value: `${user.isNew ? 'Yes' : 'No'}`, inline: true },
						{
							name: 'Total infractions',
							value: `${infractionCount >= 1 ? infractionCount : 'No infractions present.'}`,
							inline: true,
						},
						{ name: 'Channel', value: `<#${message.channel.id}> | 🔗 [Message link](${infractionMessage.url})` },
					);

					const hardCodedApplePerms = (member: GuildMember) =>
						member.roles.cache.has('332343869163438080') &&
						member.user.id !== '207177968722640897' &&
						member.user.id !== '174602493890789377';
					const hardCodedMicrosoftPerms = (member: GuildMember) => member.roles.cache.has('352519899048050688');

					const onlineModerators = channel.members.filter(
						(member) =>
							(member.permissions.has(PermissionFlagsBits.KickMembers) ||
								hardCodedApplePerms(member) ||
								hardCodedMicrosoftPerms(member)) &&
							member.presence !== null &&
							member.presence?.status !== 'offline' &&
							member.user?.bot === false,
					);

					const allModerators = channel.members.filter(
						(member) =>
							(member.permissions.has(PermissionFlagsBits.KickMembers) ||
								hardCodedApplePerms(member) ||
								hardCodedMicrosoftPerms(member)) &&
							member.user?.bot === false,
					);

					const existingThread = await channel.threads
						.fetchArchived()
						.then((thread) =>
							thread.threads.filter((t) => t.name.split(/ +/g).slice(-1)[0] === message.author.id).first(),
						);

					let itemsProcessed = 0;
					const sendReport = async (selectedThreadMods: Collection<string, GuildMember>, thread: ThreadChannel) => {
						itemsProcessed++;
						if (itemsProcessed === selectedThreadMods.size) {
							const reportMessage = await thread.send({
								content: '@here',
								embeds: [investigationEmbed, ...attachmentEmbeds],
								components: [reportActions],
							});

							const pins = await thread.messages.fetchPinned();

							if (pins.size >= 49) await pins.last()?.unpin();
							await reportMessage.pin();
						}
					};

					let thread: ThreadChannel;
					if (existingThread) {
						thread = existingThread;
						await thread.setArchived(false);
					} else {
						thread = await channel.threads.create({
							name: `${message.author.username.slice(0, 10)} ${message.author.id}`,
							autoArchiveDuration: 1440,
							reason: `Infraction received for user ${message.author.id}`,
						});
					}

					if (onlineModerators?.size) {
						onlineModerators.forEach((moderator) =>
							thread.members.add(moderator).then(() => sendReport(onlineModerators, thread)),
						);
					} else {
						allModerators?.forEach((moderator) =>
							thread.members.add(moderator).then(() => sendReport(allModerators, thread)),
						);
					}
				}
			};

			if (toxicity >= 0.85 || (insult >= 0.95 && user.isNew) || toxicity >= 0.85 || combined >= 0.85) {
				if (Math.random() < 0.5) await message.channel.sendTyping();

				const evaluatedMessages: string[] = [];
				async function getLatestUserMessages(userId: string) {
					const messages = (await message.channel.messages.fetch({
						limit: 30,
					})) as Collection<string, Message>;

					const latestMessages = messages
						.filter((m) => m.author.id === userId)
						.sort((a, b) => b.createdTimestamp - a.createdTimestamp)
						.first(3);

					evaluatedMessages.push(...latestMessages.map((m) => m.cleanContent));

					return await Promise.all(
						evaluatedMessages.map(async (evaluationMessage) => {
							const attributeScores = await getToxicity(evaluationMessage, true);
							return {
								content: evaluationMessage,
								attributeScores,
							} satisfies AnalyzedMessage;
						}),
					);
				}

				const latestMessages = await getLatestUserMessages(message.author.id);

				if (latestMessages.length === 2) {
					if (isNaN(latestMessages[1].attributeScores.toxicity)) return;
					if (
						(latestMessages[0].attributeScores.toxicity + latestMessages[1].attributeScores.toxicity) / 2 >= 0.7 &&
						!user.isRegular
					) {
						createAlerts(latestMessages);
					}
				}
				if (latestMessages.length === 3) {
					if (isNaN(latestMessages[1].attributeScores.toxicity) || isNaN(latestMessages[2].attributeScores.toxicity))
						return;
					if (
						(latestMessages[0].attributeScores.toxicity +
							latestMessages[1].attributeScores.toxicity +
							latestMessages[2].attributeScores.toxicity) /
							3 >=
						0.7
					) {
						createAlerts(latestMessages);
					}
				} else {
					if (!user.isNew) return;
					createAlerts(latestMessages);
				}
			}
		} catch (error) {
			this.client.logger.error({
				author: message.author.id,
				server: message.guild.id,
				message: message.content,
				error,
			});
		}
	}
}
