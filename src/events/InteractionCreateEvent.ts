import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	CommandInteraction,
	ContextMenuCommandInteraction,
	Events,
	MessageComponentInteraction,
	PermissionsBitField,
	type InteractionReplyOptions,
} from 'discord.js';

import { ohsimusAsset } from '../constants.js';
import { DotsimusClient } from '../structures/DotsimusClient.js';
import { Event } from '../structures/Event.js';

export default class InteractionCreateEvent extends Event {
	constructor(client: DotsimusClient) {
		super(client, { name: Events.InteractionCreate });
	}

	async execute(interaction: CommandInteraction | MessageComponentInteraction | ContextMenuCommandInteraction) {
		if (!interaction.inCachedGuild()) {
			const dmButtonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setLabel('Join Dotsimus Server')
					.setURL('https://discord.gg/XAFXecKFRG')
					.setStyle(ButtonStyle.Link),
				new ButtonBuilder()
					.setLabel('Get Dotsimus')
					.setURL(
						'https://discord.com/oauth2/authorize?client_id=731190736996794420&permissions=17247366359&redirect_uri=https%3A%2F%2Fdotsimus.com&response_type=code&scope=bot%20identify%20applications.commands',
					)
					.setStyle(ButtonStyle.Link),
			);

			await interaction.reply({
				content:
					'Oh snap! Commands are only available within servers. You can test commands freely on Dotsimus server.',
				ephemeral: true,
				files: [ohsimusAsset],
				components: [dmButtonsRow],
			});
			return;
		}

		try {
			const guildMembers = interaction.guild.members;

			const interName = interaction.isCommand() ? interaction.commandName : interaction.customId;
			const inter = this.client.interactions.get(interName);

			if (!inter) return;

			if (interaction.isChatInputCommand()) {
				const cooldown = this.client.cooldowns.get(interaction.user.id);

				if (cooldown && cooldown === interaction.commandName) {
					await interaction.reply({
						content: 'Oh snap! You have already used this action or command in the last 5 seconds.',
						ephemeral: true,
						files: [ohsimusAsset],
					});
					return;
				}

				this.client.cooldowns.set(interaction.user.id, interaction.commandName);
				setTimeout(() => this.client.cooldowns.delete(interaction.user.id), 5000);
			}

			if (!guildMembers.me?.permissions.has(inter.clientPermissions || [])) {
				const permissionsString =
					'**' + new PermissionsBitField(inter.clientPermissions).toArray().join('**, **') + '**';

				await interaction.reply({
					content: `Oh snap! I don\'t have sufficient permissions to execute this command. Missing: ${permissionsString}`,
					ephemeral: true,
					files: [ohsimusAsset],
				});
			}

			if (!interaction.member.permissions.has(inter.userPermissions || [])) {
				const permissionsString = '**' + new PermissionsBitField(inter.userPermissions).toArray().join('**, **') + '**';

				await interaction.reply({
					content: `Oh snap! You don\'t have sufficient permissions to execute this command. Missing: ${permissionsString}`,
					ephemeral: true,
					files: [ohsimusAsset],
				});
			}

			await inter.execute(interaction);
		} catch (error) {
			this.client.logger.error(error);

			const response: InteractionReplyOptions = {
				content: 'Oh snap! Something went wrong while running this command.',
				ephemeral: true,
				files: [ohsimusAsset],
			};

			if (interaction.replied) await interaction.followUp(response);
			else if (interaction.deferred) await interaction.editReply(response);
			else await interaction.reply(response);
		}
	}
}
