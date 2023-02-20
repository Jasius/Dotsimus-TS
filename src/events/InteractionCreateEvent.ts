import {
	CommandInteraction,
	ContextMenuCommandInteraction,
	Events,
	MessageComponentInteraction,
	PermissionsBitField,
	PermissionsString,
	type InteractionReplyOptions,
	type PermissionResolvable,
} from 'discord.js';

import { ohsimusAsset } from '../constants.js';
import { DotsimusClient } from '../structures/DotsimusClient.js';
import { Event } from '../structures/Event.js';

export default class InteractionCreateEvent extends Event {
	constructor(client: DotsimusClient) {
		super(client, { name: Events.InteractionCreate });
	}

	async execute(interaction: CommandInteraction | MessageComponentInteraction | ContextMenuCommandInteraction) {
		if (!interaction.inCachedGuild()) return;

		try {
			const guildMembers = interaction.guild.members;

			const commandKey = interaction.isMessageComponent() ? interaction.customId : interaction.commandName;
			const command = this.client.commands.get(commandKey);

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

			if (!command) return;

			if (!guildMembers.me?.permissions.has(command.clientPermissions || [])) {
				const permissionsString =
					'**' + new PermissionsBitField(command.clientPermissions).toArray().join('**, **') + '**';

				await interaction.reply({
					content: `Oh snap! I don\'t have sufficient permissions to execute this command. Missing: ${permissionsString}`,
					ephemeral: true,
					files: [ohsimusAsset],
				});
			}

			if (!interaction.member.permissions.has(command.userPermissions || [])) {
				const permissionsString =
					'**' + new PermissionsBitField(command.userPermissions).toArray().join('**, **') + '**';

				await interaction.reply({
					content: `Oh snap! You don\'t have sufficient permissions to execute this command. Missing: ${permissionsString}`,
					ephemeral: true,
					files: [ohsimusAsset],
				});
			}

			await command.execute(interaction);
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
