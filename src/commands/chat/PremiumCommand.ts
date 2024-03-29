import {
	ChannelType,
	ChatInputCommandInteraction,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
	TextChannel,
} from 'discord.js';

import { Command } from '../../structures/Command.js';
import { DotsimusClient } from '../../structures/DotsimusClient.js';

export default class PremiumCommand extends Command {
	constructor(client: DotsimusClient) {
		super(client, {
			name: 'premium',
			description: 'Configure premium servers.',
			userPermissions: PermissionFlagsBits.Administrator,
			options: new SlashCommandBuilder()
				.addSubcommand((subcommand) =>
					subcommand
						.setName('configure')
						.setDescription('Configure premium features.')
						.addRoleOption((option) =>
							option
								.setName('role')
								.setDescription('Muted role that will be assigned to flagged members.')
								.setRequired(true),
						)
						.addChannelOption((option) =>
							option
								.setName('channel')
								.setDescription('Channel where flagged messages and users will be shown.')
								.setRequired(true)
								.addChannelTypes(ChannelType.GuildText),
						),
				)
				.addSubcommand((subcommand) => subcommand.setName('disable').setDescription('Disables all premium features.')),
		});
	}

	async execute(interaction: ChatInputCommandInteraction) {
		const isPremium = await this.client.utils.saveServerConfig(interaction.guild!);

		if (!isPremium) {
			return interaction.reply({
				content:
					'This command can only be run on a premium server, learn more over at [Dotsimus.com](https://dotsimus.com/).',
				ephemeral: true,
			});
		}

		switch (interaction.options.getSubcommand()) {
			case 'configure':
				return this.executeConfigure(interaction);
			case 'disable':
				return this.executeDisable(interaction);
			default:
				return interaction.reply({
					content: "Oops, this one doesn't work just yet...",
					ephemeral: true,
				});
		}
	}

	async executeConfigure(interaction: ChatInputCommandInteraction) {
		const role = interaction.options.getRole('role', true);
		const channel = interaction.options.getChannel('channel', true) as TextChannel;

		await this.client.utils.saveAlert({
			serverId: interaction.guild!.id,
			threshold: 0.6,
			channelId: channel.id,
			mention: { type: 'role', id: role.id },
		});
		await channel.send({
			embeds: [
				new EmbedBuilder({ color: 0x0099ff })
					.setTitle('Dotsimus Reports')
					.setDescription(`This channel has been setup for Dotsimus reports.`)
					.addFields({ name: 'Muted role', value: role.toString(), inline: false }),
			],
		});

		return interaction.reply({
			content: 'Configuration successful!',
			ephemeral: true,
		});
	}

	async executeDisable(interaction: ChatInputCommandInteraction) {
		await this.client.utils.deleteAlert(interaction.guild!.id);

		return interaction.reply({
			content: 'Premium features disabled!',
			ephemeral: true,
		});
	}
}
