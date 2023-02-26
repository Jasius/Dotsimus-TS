import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ColorResolvable,
	EmbedBuilder,
	GuildTextBasedChannel,
	PermissionFlagsBits,
	StringSelectMenuInteraction,
} from 'discord.js';

import { Component } from '../structures/Component.js';
import { DotsimusClient } from '../structures/DotsimusClient.js';

export default class DisableTrackingComponent extends Component {
	constructor(client: DotsimusClient) {
		super(client, { name: 'investigationDropdown' });
	}

	async execute(interaction: StringSelectMenuInteraction) {
		const [, infractionId] = interaction.customId.split(/-+/g);

		if (!interaction.inCachedGuild()) {
			return interaction.reply({ content: 'This action is only available within servers.', ephemeral: true });
		}

		if (
			!interaction.member.permissions.has(PermissionFlagsBits.KickMembers) &&
			!interaction.member.permissions.has(PermissionFlagsBits.BanMembers) &&
			!interaction.member.roles.cache.some((role) => role.id === '332343869163438080') &&
			!interaction.member.roles.cache.some((role) => role.id === '352519899048050688')
		) {
			return interaction.reply({
				content:
					Math.random() < 0.9
						? 'You do not have permissions to do this action.'
						: "You nasty devil, you don't take no for an answer?",
				ephemeral: true,
			});
		}

		const infraction = await this.client.utils.getInfraction(infractionId);

		if (!infraction) {
			return interaction.reply({ content: 'Could not get the infraction.', ephemeral: true });
		}

		const flaggedMember = await interaction.guild.members.fetch(infraction.userId);
		const investigationEmbed = interaction.message.embeds[0];

		if (!investigationEmbed.footer) {
			return interaction.reply({ content: 'Could not get flagged message info.', ephemeral: true });
		}

		const [infractionChannelId, infractionMessageId] = investigationEmbed.footer.text.split(/ +/);

		const closeInvestigation = async (
			publicActionNotice?: string,
			privateActionNotice?: string,
			publicActionEmbeds?: EmbedBuilder[],
		) => {
			const infractionChannel = await interaction.guild.channels
				.fetch(infractionChannelId)
				.then((channel) => channel as GuildTextBasedChannel | null);

			if (!infractionChannel) {
				this.client.logger.warn({
					message: `Could not fetch infraction channel for ${infractionChannelId}`,
				});
				return;
			}

			const infractionMessage = await infractionChannel.messages.fetch(infractionMessageId);

			await infractionMessage.edit({
				content: publicActionNotice,
				embeds: publicActionEmbeds,
			});

			await interaction.reply({
				content: privateActionNotice,
				ephemeral: true,
			});

			if (interaction.channel?.isThread()) {
				await interaction.channel.setArchived(true);
			}
		};

		const logNotice = async (messageColor: ColorResolvable, actionOutcome: string) => {
			const alert = await this.client.utils.getAlert(interaction.guild.id);

			if (!alert) return;

			const investigationNotice = new EmbedBuilder()
				.setColor(messageColor)
				.setTitle(actionOutcome)
				.setDescription(`Moderated by ${interaction.user.toString()}`)
				.addFields(
					{ name: 'Message', value: infraction.message.message },
					{ name: 'User', value: flaggedMember.toString() },
				);

			const investigationRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder().setLabel('Open thread').setURL(interaction.message.url).setStyle(ButtonStyle.Link),
			);

			const channel = await interaction.guild.channels.fetch(alert.channelId);
			if (channel?.isTextBased()) {
				channel.send({ embeds: [investigationNotice], components: [investigationRow] });
			}
		};

		const updatedEmbed = new EmbedBuilder(investigationEmbed.data).setFooter(null);
		const alert = await this.client.utils.getAlert(interaction.guildId);

		let actionColor: ColorResolvable;
		let privateActionNotice: string;

		switch (interaction.values[0]) {
			case 'reportApprovalAction':
				actionColor = 0x32cd32;

				closeInvestigation(
					'Message removed, report verified by the moderation team.',
					'Report approved, user is notified & muted.',
				);
				logNotice(actionColor, 'Report approved, user is muted indefinitely');

				return interaction.message.edit({
					content: `Report approved by ${interaction.user.toString()}`,
					embeds: [updatedEmbed.setColor(actionColor)],
					components: [],
				});

			case 'reportApprovalUnmuteAction':
				actionColor = 0xffbd2e;

				privateActionNotice = 'Report approved, user is notified & unmuted';
				if (alert) {
					try {
						await flaggedMember.roles.remove(alert.mention.id);
					} catch (error) {
						this.client.logger.warn({
							message: `Could not remove mention role from ${flaggedMember.id}.`,
							error: error,
						});

						privateActionNotice = 'Report approved, user is notified, but not unmuted due to an error';
					}
				} else {
					privateActionNotice = 'Report approved, user is notified, but not unmuted due to missing alert setup';
				}

				const unmutedRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setLabel('Get back to chat')
						.setURL(`https://discord.com/channels/${interaction.guildId}/${infractionChannelId}/${infractionMessageId}`)
						.setStyle(ButtonStyle.Link),
				);

				try {
					await flaggedMember.send({
						content: `You're no longer muted on **${interaction.guild.name}**.`,
						components: [unmutedRow],
					});
				} catch (error) {
					this.client.logger.warn({
						message: `Could not send unmute notice to ${flaggedMember.id}.`,
						error: error,
					});
				}

				closeInvestigation('Message removed, report verified by the moderation team.', privateActionNotice);
				logNotice(actionColor, 'Report approved, user is unmuted');

				return interaction.message.edit({
					content: `Report approved, user is notified and unmuted by ${interaction.user.toString()}`,
					embeds: [updatedEmbed.setColor(actionColor)],
					components: [],
				});

			case 'reportRejectionAction':
				actionColor = 0xe91e63;

				await this.client.utils.deleteInfraction(infractionId);

				const reinstatedNotice = new EmbedBuilder({ color: 0x32cd32 })
					.setAuthor({
						name: `${flaggedMember.user.username}#${flaggedMember.user.discriminator}`,
						iconURL: flaggedMember.displayAvatarURL(),
						url: `https://discord.com/users/${flaggedMember.id}`,
					})
					.setDescription(`${investigationEmbed.fields[0].value}`)
					.setFooter({
						text: 'Message reinstated by the moderation team.',
						iconURL: interaction.guild.iconURL({ extension: 'webp' }) ?? undefined,
					});

				privateActionNotice = 'Report rejected, user is notified & unmuted.';
				if (alert) {
					try {
						await flaggedMember.roles.remove(alert.mention.id);
					} catch (error) {
						this.client.logger.warn({
							message: `Could not remove mention role from ${flaggedMember.id}.`,
							error: error,
						});

						privateActionNotice = 'Report rejected, user is notified, but not unmuted due to an error';
					}
				} else {
					privateActionNotice = 'Report rejected, user is notified, but not unmuted due to missing alert setup';
				}

				const reinstatedRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setLabel('Go to message')
						.setURL(`https://discord.com/channels/${interaction.guildId}/${infractionChannelId}/${infractionMessageId}`)
						.setStyle(ButtonStyle.Link),
				);

				try {
					await flaggedMember.send({
						content: `Hooray! Your infraction is removed and your message reinstated on **${interaction.guild.name}** by the moderation team.`,
						embeds: [reinstatedNotice],
						components: [reinstatedRow],
					});
				} catch (error) {
					this.client.logger.warn({ message: `Could not send unmute notice to ${flaggedMember.id}.`, error });
				}

				closeInvestigation(undefined, privateActionNotice, [reinstatedNotice]);
				logNotice(actionColor, 'Report rejected, user is notified and unmuted');

				return interaction.message.edit({
					content: `Report rejected, user is notified and unmuted by ${interaction.user.toString()}`,
					embeds: [updatedEmbed.setColor(actionColor)],
					components: [],
				});

			// case 'reportApprovalBanAction':
			default:
				return interaction.reply({
					content: "Oops, this one doesn't work just yet...",
					ephemeral: true,
				});
		}
	}
}
