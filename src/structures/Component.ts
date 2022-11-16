import type { MessageComponentInteraction, PermissionResolvable } from 'discord.js';

import type { CommandResponse } from '../typings';
import type { DotsimusClient } from './DotsimusClient';

interface ComponentOptions {
    name: string;
    clientPermissions?: PermissionResolvable;
    userPermissions?: PermissionResolvable;
}

export abstract class Component implements ComponentOptions {
    client: DotsimusClient<true>;
    name: string;
    clientPermissions?: PermissionResolvable;
    userPermissions?: PermissionResolvable;

    constructor(client: DotsimusClient<true>, options: ComponentOptions) {
        this.client = client;
        this.name = options.name;
        this.clientPermissions = options.clientPermissions;
        this.userPermissions = options.userPermissions;
    }

    toJSON() {
        return { customId: this.name };
    }

    abstract execute(interaction: MessageComponentInteraction): Promise<CommandResponse>;
}
