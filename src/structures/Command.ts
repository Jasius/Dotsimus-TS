import {
    ApplicationCommandType,
    type ChatInputApplicationCommandData,
    type ChatInputCommandInteraction,
    type PermissionResolvable,
    type SlashCommandOptionsOnlyBuilder,
    type SlashCommandSubcommandsOnlyBuilder
} from 'discord.js';

import type { CommandResponse } from '../typings';
import type { DotsimusClient } from './DotsimusClient';

interface CommandOptions {
    name: string;
    description?: string;
    options?: SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
    clientPermissions?: PermissionResolvable;
    userPermissions?: PermissionResolvable;
    dmPermission?: boolean;
}

export abstract class Command implements CommandOptions {
    client: DotsimusClient<true>;
    name: string;
    description?: string;
    options?: SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
    clientPermissions?: PermissionResolvable;
    userPermissions?: PermissionResolvable;
    dmPermission?: boolean;

    constructor(client: DotsimusClient<true>, options: CommandOptions) {
        this.client = client;
        this.name = options.name;
        this.description = options.description;
        this.options = options.options;
        this.clientPermissions = options.clientPermissions;
        this.userPermissions = options.userPermissions;
        this.dmPermission = options.dmPermission;
    }

    toJSON(): ChatInputApplicationCommandData {
        return {
            name: this.name,
            description: this.description ?? 'No description provided',
            defaultMemberPermissions: this.userPermissions,
            dmPermission: this.dmPermission,
            type: ApplicationCommandType.ChatInput,
            options: this.options?.options.map((o) => o.toJSON())
        };
    }

    abstract execute(interaction: ChatInputCommandInteraction): Promise<CommandResponse>;
}
