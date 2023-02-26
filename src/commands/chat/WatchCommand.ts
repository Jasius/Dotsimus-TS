import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
	ChatInputCommandInteraction,
	SelectMenuComponentOptionData,
} from 'discord.js';

import { Command } from '../../structures/Command.js';
import { DotsimusClient } from '../../structures/DotsimusClient.js';
import type { CommandResponse } from '../../typings';

export default class AboutCommand extends Command {
	constructor(client: DotsimusClient) {
		super(client, {
			name: 'watch',
			description: 'Sends a direct message to you whenever keyword that you track gets mentioned.',
			options: new SlashCommandBuilder()
				.addSubcommand((subcommand) =>
					subcommand.setName('remove').setDescription('Allows to remove tracked keywords.'),
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName('add')
						.setDescription('Sends a direct message to you whenever keyword that you track gets mentioned.')
						.addStringOption((option) =>
							option
								.setName('keyword')
								.setDescription('Allows to set up tracking for preferred keywords.')
								.setRequired(true),
						),
				)
				.addSubcommand((subcommand) => subcommand.setName('list').setDescription('Lists tracked keywords.')),
		});
	}

	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });

		switch (interaction.options.getSubcommand()) {
			case 'remove':
				return this.executeRemove(interaction);
			case 'add':
				return this.executeAdd(interaction);
			case 'list':
				return this.executeList(interaction);
			default:
				return interaction.reply({
					content: "Oops, this one doesn't work just yet...",
					ephemeral: true,
				});
		}
	}

	async executeRemove(interaction: ChatInputCommandInteraction): Promise<CommandResponse> {
		const watchedKeywords = await this.client.utils.getWatchedKeywords(interaction.user.id, interaction.guild!.id);

		if (!watchedKeywords?.watchedWords.length) {
			return interaction.editReply(
				"You aren't tracking any keywords for this server. Track words by using the `/watch` command!",
			);
		}

		const options = watchedKeywords.watchedWords.map<SelectMenuComponentOptionData>((word) => ({
			label: word,
			value: word,
		}));

		const keywordRow = new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
			new StringSelectMenuBuilder()
				.setCustomId('removeKeywords')
				.setMaxValues(options.length)
				.setMinValues(1)
				.setOptions(options),
		);

		const buttonRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
			new ButtonBuilder().setCustomId('disableTracking').setLabel('Disable Tracking').setStyle(ButtonStyle.Danger),
		);

		return interaction.editReply({
			content: 'Select keywords that you want to remove.',
			components: [keywordRow, buttonRow],
		});
	}

	async executeAdd(interaction: ChatInputCommandInteraction): Promise<CommandResponse> {
		const keyword = interaction.options.getString('keyword', true).toLowerCase();

		const { watchedWords } = await this.client.utils.saveWatchedKeywords(interaction.user.id, interaction.guild!.id, [
			keyword,
		]);

		const keywordListEmbed = new EmbedBuilder({ color: 0x0099ff })
			.setTitle('Your tracked keywords for this server')
			.setDescription(watchedWords.map((word) => `⦿ ${word}`).join('\n'))
			.setFooter({
				text: `${
					watchedWords.length === 5
						? 'You cannot track more than 5 keywords.'
						: `You can track ${5 - watchedWords.length} more ${watchedWords.length >= 4 ? 'keyword' : 'keywords'}.`
				}\n❗️Direct messages must be enabled for this feature to work.`,
			});

		return interaction.editReply({
			content: `\`${keyword}\` keyword tracking is enabled successfully on this server!`,
			embeds: [keywordListEmbed],
		});
	}

	async executeList(interaction: ChatInputCommandInteraction): Promise<CommandResponse> {
		const watchedKeywords = await this.client.utils.getWatchedKeywords(interaction.user.id, interaction.guild!.id);

		if (!watchedKeywords?.watchedWords.length) {
			return interaction.editReply(
				"You aren't tracking any keywords for this server. Track words by using the `/watch` command!",
			);
		}

		const keywordListEmbed = new EmbedBuilder({ color: 0x0099ff })
			.setTitle('Your tracked keywords for this server')
			.setDescription(watchedKeywords.watchedWords.map((word) => `⦿ ${word}`).join('\n'));

		return interaction.editReply({ embeds: [keywordListEmbed] });
	}
}
