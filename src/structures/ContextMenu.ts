import {
    type ContextMenuCommandInteraction,
    type MessageApplicationCommandData,
    type PermissionResolvable,
    type UserApplicationCommandData
} from 'discord.js';

import type { CommandResponse, ContextMenuType } from '../typings';
import type { DotsimusClient } from './DotsimusClient';

interface ContextMenuOptions {
    name: string;
    clientPermissions?: PermissionResolvable;
    userPermissions?: PermissionResolvable;
    dmPermission?: boolean;
    type: ContextMenuType;
}

export abstract class ContextMenu implements ContextMenuOptions {
    client: DotsimusClient<true>;
    name: string;
    clientPermissions?: PermissionResolvable;
    userPermissions?: PermissionResolvable;
    dmPermission?: boolean;
    type: ContextMenuType;

    constructor(client: DotsimusClient<true>, options: ContextMenuOptions) {
        this.client = client;
        this.name = options.name;
        this.clientPermissions = options.clientPermissions;
        this.userPermissions = options.userPermissions;
        this.dmPermission = options.dmPermission;
        this.type = options.type;
    }

    toJSON(): UserApplicationCommandData | MessageApplicationCommandData {
        return {
            name: this.name,
            defaultMemberPermissions: this.userPermissions,
            dmPermission: this.dmPermission,
            type: this.type
        };
    }

    abstract execute(interaction: ContextMenuCommandInteraction): Promise<CommandResponse>;
}
