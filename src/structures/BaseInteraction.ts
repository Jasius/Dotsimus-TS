import { BaseInteraction as BaseInteraction_, type PermissionResolvable } from 'discord.js';

import type { CommandResponse } from '../typings';
import { DotsimusClient } from './DotsimusClient.js';

export interface BaseInteractionOptions {
	name: string;
	clientPermissions?: PermissionResolvable;
	userPermissions?: PermissionResolvable;
}

export abstract class BaseInteraction implements BaseInteractionOptions {
	client: DotsimusClient<true>;
	name: string;
	clientPermissions?: PermissionResolvable;
	userPermissions?: PermissionResolvable;

	constructor(client: DotsimusClient<true>, options: BaseInteractionOptions) {
		this.client = client;
		this.name = options.name;
		this.clientPermissions = options.clientPermissions;
		this.userPermissions = options.userPermissions;
	}

	abstract execute(interaction: BaseInteraction_): Promise<CommandResponse>;
}
