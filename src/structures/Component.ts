import { MessageComponentInteraction } from 'discord.js';

import type { CommandResponse } from '../typings';
import { BaseInteraction, BaseInteractionOptions } from './BaseInteraction.js';
import { DotsimusClient } from './DotsimusClient.js';

export abstract class Component extends BaseInteraction implements BaseInteractionOptions {
	constructor(client: DotsimusClient<true>, options: BaseInteractionOptions) {
		super(client, options);
	}

	abstract execute(interaction: MessageComponentInteraction): Promise<CommandResponse>;
}
