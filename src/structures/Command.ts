import {
	ApplicationCommandType,
	ChatInputCommandInteraction,
	type ChatInputApplicationCommandData,
	type SlashCommandOptionsOnlyBuilder,
	type SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';

import type { CommandResponse } from '../typings';
import { BaseInteraction, BaseInteractionOptions } from './BaseInteraction.js';
import { DotsimusClient } from './DotsimusClient.js';

interface CommandOptions extends BaseInteractionOptions {
	description?: string;
	options?: SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
}

export abstract class Command extends BaseInteraction implements CommandOptions {
	description?: string;
	options?: SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;

	constructor(client: DotsimusClient<true>, options: CommandOptions) {
		super(client, options);

		this.description = options.description;
		this.options = options.options;
	}

	toJSON(): ChatInputApplicationCommandData {
		return {
			name: this.name,
			description: this.description ?? 'No description provided',
			defaultMemberPermissions: this.userPermissions,
			type: ApplicationCommandType.ChatInput,
			options: this.options?.options.map((o) => o.toJSON()),
		};
	}

	abstract execute(interaction: ChatInputCommandInteraction): Promise<CommandResponse>;
}
