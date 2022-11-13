import { CommandInteraction, Events } from 'discord.js';
import { DotsimusClient } from '../structures/DotsimusClient';
import { Event } from '../structures/Event';

export default class InteractionCreateEvent extends Event {
    constructor(client: DotsimusClient) {
        super(client, { name: Events.InteractionCreate });
    }

    async execute(interaction: CommandInteraction): Promise<any> {
        if (!interaction.isChatInputCommand()) return;

        const command = this.client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (err) {
            // TODO: Handle
        }
    }
}
