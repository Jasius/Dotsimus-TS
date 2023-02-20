import { ButtonInteraction } from 'discord.js';

import { Component } from '../structures/Component.js';
import { DotsimusClient } from '../structures/DotsimusClient.js';

export default class DisableTrackingComponent extends Component {
	constructor(client: DotsimusClient) {
		super(client, { name: 'disableTracking' });
	}

	async execute(interaction: ButtonInteraction) {
		await this.client.utils.deleteWatchedKeywords(interaction.user.id, interaction.guild!.id);

		return interaction.update({ content: 'Disabled tracking for all keywords.', components: [] });
	}
}
