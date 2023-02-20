import { ApplicationCommandType, MessageContextMenuCommandInteraction } from 'discord.js';

import { ContextMenu } from '../../structures/ContextMenu.js';
import { DotsimusClient } from '../../structures/DotsimusClient.js';

export default class RemoveKeywordsComponent extends ContextMenu {
	constructor(client: DotsimusClient) {
		super(client, { name: 'Report Message', dmPermission: false, type: ApplicationCommandType.Message });
	}

	async execute(interaction: MessageContextMenuCommandInteraction) {
		return interaction.reply({ content: 'execute() not implemented.', ephemeral: true });
	}
}
