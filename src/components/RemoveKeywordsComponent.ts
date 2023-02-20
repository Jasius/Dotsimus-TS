import type { StringSelectMenuInteraction } from 'discord.js';

import { Component } from '../structures/Component.js';
import type { DotsimusClient } from '../structures/DotsimusClient.js';

export default class RemoveKeywordsComponent extends Component {
	constructor(client: DotsimusClient) {
		super(client, { name: 'removeKeywords' });
	}

	async execute(interaction: StringSelectMenuInteraction) {
		const keywords = interaction.values;

		await this.client.utils.deleteWatchedKeywords(interaction.user.id, interaction.guild!.id, keywords);

		return interaction.update({ content: `Removed ${keywords.length} keyword(s).`, components: [] });
	}
}
