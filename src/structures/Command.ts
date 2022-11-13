import {
    ApplicationCommandType,
    ChatInputApplicationCommandData,
    CommandInteraction,
    InteractionResponse,
    Message,
    PermissionResolvable,
    SlashCommandOptionsOnlyBuilder,
    SlashCommandSubcommandsOnlyBuilder
} from 'discord.js';
import { DotsimusClient } from './DotsimusClient';

interface CommandOptions {
    name: string;
    description?: string;
    options: SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
    clientPermissions?: PermissionResolvable;
    userPermissions?: PermissionResolvable;
    dmPermission?: boolean;
}

export type CommandResponse = Message | InteractionResponse;

export abstract class Command implements CommandOptions {
    client: DotsimusClient<true>;
    name: string;
    description?: string;
    options: SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
    clientPermissions?: PermissionResolvable | undefined;
    userPermissions?: PermissionResolvable | undefined;
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
            options: this.options.options.map((o) => o.toJSON())
        };
    }

    abstract execute(interaction: CommandInteraction): Promise<CommandResponse>;
}
