import {
    Events,
    PermissionsBitField,
    type CommandInteraction,
    type ContextMenuCommandInteraction,
    type GuildMember,
    type InteractionReplyOptions,
    type MessageComponentInteraction,
    type PermissionResolvable
} from 'discord.js';

import { ohSimusAsset } from '../constants';
import type { DotsimusClient } from '../structures/DotsimusClient';
import { Event } from '../structures/Event';

export default class InteractionCreateEvent extends Event {
    constructor(client: DotsimusClient) {
        super(client, { name: Events.InteractionCreate });
    }

    async execute(interaction: CommandInteraction | MessageComponentInteraction | ContextMenuCommandInteraction) {
        try {
            const me = await interaction.guild?.members.fetchMe();
            const member = await interaction.guild?.members.fetch(interaction.user.id);

            const checkPermissions = async (member: GuildMember, permissions: PermissionResolvable) => {
                if (interaction.guild && !member.permissions.has(permissions)) {
                    const permissionsString = new PermissionsBitField(permissions).toArray().join('`, `');
                    const pronoun = member.user.id === interaction.client.user.id ? 'I' : 'You';

                    await interaction.reply({
                        content: `Oh snap! ${pronoun} don't have the required permissions to run this command. Missing: \`${permissionsString}\``,
                        ephemeral: true,
                        files: [ohSimusAsset]
                    });
                    return;
                }
            };

            if (interaction.isChatInputCommand()) {
                const command = this.client.commands.get(interaction.commandName);
                const cooldown = this.client.cooldowns.get(interaction.user.id);

                if (!command) return;

                if (interaction.guild && command.clientPermissions)
                    await checkPermissions(me!, command.clientPermissions);
                if (interaction.guild && command.userPermissions)
                    await checkPermissions(member!, command.userPermissions);

                if (cooldown && cooldown === interaction.commandName) {
                    await interaction.reply({
                        content: 'Oh snap! You have already used this action or command in the last 5 seconds.',
                        ephemeral: true,
                        files: [ohSimusAsset]
                    });
                    return;
                }

                this.client.cooldowns.set(interaction.user.id, interaction.commandName);
                setTimeout(() => this.client.cooldowns.delete(interaction.user.id), 5000);

                await command.execute(interaction);
            }

            if (interaction.isContextMenuCommand()) {
                const contextMenu = this.client.contextMenus.get(interaction.commandName);

                if (!contextMenu) return;

                if (interaction.guild && contextMenu.clientPermissions)
                    await checkPermissions(me!, contextMenu.clientPermissions);
                if (interaction.guild && contextMenu.userPermissions)
                    await checkPermissions(member!, contextMenu.userPermissions);

                await contextMenu.execute(interaction);
            }

            if (interaction.isMessageComponent()) {
                const component = this.client.components.get(interaction.customId);

                if (!component) return;

                if (interaction.guild && component.clientPermissions)
                    await checkPermissions(me!, component.clientPermissions);
                if (interaction.guild && component.userPermissions)
                    await checkPermissions(member!, component.userPermissions);

                await component.execute(interaction);
            }
        } catch (error) {
            this.client.logger.error(error);

            const response: InteractionReplyOptions = {
                content: 'Oh snap! Something went wrong while running this command.',
                ephemeral: true,
                files: [ohSimusAsset]
            };

            if (interaction.replied) await interaction.followUp(response);
            else if (interaction.deferred) await interaction.editReply(response);
            else await interaction.reply(response);
        }
    }
}
