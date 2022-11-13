import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    CommandInteraction,
    Events,
    InteractionReplyOptions
} from 'discord.js';

import { ohSimusAsset } from '../constants';
import { DotsimusClient } from '../structures/DotsimusClient';
import { Event } from '../structures/Event';

export default class InteractionCreateEvent extends Event {
    constructor(client: DotsimusClient) {
        super(client, { name: Events.InteractionCreate });
    }

    async execute(interaction: CommandInteraction): Promise<any> {
        if (!interaction.isChatInputCommand()) return;

        const command = this.client.commands.get(interaction.commandName);
        const cooldown = this.client.cooldowns.get(interaction.user.id);

        if (!command) return;

        if (cooldown && cooldown === interaction.commandName) {
            return interaction.reply({
                content: 'Oh snap! You have already used this action or command in the last 5 seconds.',
                ephemeral: true,
                files: [ohSimusAsset]
            });
        }

        this.client.cooldowns.set(interaction.user.id, interaction.commandName);
        setTimeout(() => this.client.cooldowns.delete(interaction.user.id), 5000);

        try {
            await command.execute(interaction);
        } catch (err) {
            this.client.logger.error(err);

            const response: InteractionReplyOptions = {
                content: 'Oh snap! Something went wrong while running this command.',
                ephemeral: true,
                files: [ohSimusAsset]
            };

            if (interaction.replied) interaction.followUp(response);
            else if (interaction.deferred) interaction.editReply(response);
            else interaction.reply(response);
        }
    }
}
