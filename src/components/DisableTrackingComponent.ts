import type { ButtonInteraction } from 'discord.js';

import { Component } from '../structures/Component';
import type { DotsimusClient } from '../structures/DotsimusClient';

export default class DisableTrackingComponent extends Component {
    constructor(client: DotsimusClient) {
        super(client, { name: 'disableTracking' });
    }

    async execute(interaction: ButtonInteraction) {
        await this.client.prisma.removeWatchedKeywords(interaction.user.id, interaction.guild!.id);

        return interaction.update({ content: 'Disabled tracking for all keywords.', components: [] });
    }
}
