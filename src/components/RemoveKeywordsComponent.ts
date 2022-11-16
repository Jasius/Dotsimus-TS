import type { SelectMenuInteraction } from 'discord.js';

import { Component } from '../structures/Component';
import type { DotsimusClient } from '../structures/DotsimusClient';

export default class RemoveKeywordsComponent extends Component {
    constructor(client: DotsimusClient) {
        super(client, { name: 'removeKeywords' });
    }

    async execute(interaction: SelectMenuInteraction) {
        const keywords = interaction.values;

        await this.client.prisma.removeWatchedKeywords(interaction.user.id, interaction.guild!.id, keywords);

        return interaction.update({ content: `Removed ${keywords.length} keyword(s).`, components: [] });
    }
}
