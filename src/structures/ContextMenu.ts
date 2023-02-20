import {
	ApplicationCommandType,
	ContextMenuCommandInteraction,
	type MessageApplicationCommandData,
	type PermissionResolvable,
	type UserApplicationCommandData,
} from 'discord.js';

import type { CommandResponse } from '../typings';
import { BaseInteraction } from './BaseInteraction.js';
import { DotsimusClient } from './DotsimusClient.js';

interface ContextMenuOptions {
	name: string;
	clientPermissions?: PermissionResolvable;
	userPermissions?: PermissionResolvable;
	dmPermission?: boolean;
	type: ContextMenuType;
}

type ContextMenuType = ApplicationCommandType.Message | ApplicationCommandType.User;

export abstract class ContextMenu extends BaseInteraction implements ContextMenuOptions {
	dmPermission?: boolean;
	type: ContextMenuType;

	constructor(client: DotsimusClient<true>, options: ContextMenuOptions) {
		super(client, options);

		this.dmPermission = options.dmPermission;
		this.type = options.type;
	}

	toJSON(): UserApplicationCommandData | MessageApplicationCommandData {
		return {
			name: this.name,
			defaultMemberPermissions: this.userPermissions,
			dmPermission: this.dmPermission,
			type: this.type,
		};
	}

	abstract execute(interaction: ContextMenuCommandInteraction): Promise<CommandResponse>;
}
