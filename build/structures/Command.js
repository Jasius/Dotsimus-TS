import { ApplicationCommandType } from 'discord.js';
export class Command {
    client;
    name;
    description;
    options;
    clientPermissions;
    userPermissions;
    dmPermission;
    constructor(client, options) {
        this.client = client;
        this.name = options.name;
        this.description = options.description;
        this.options = options.options;
        this.clientPermissions = options.clientPermissions;
        this.userPermissions = options.userPermissions;
        this.dmPermission = options.dmPermission;
    }
    toJSON() {
        return {
            name: this.name,
            description: this.description ?? 'No description provided',
            defaultMemberPermissions: this.userPermissions,
            dmPermission: this.dmPermission,
            type: ApplicationCommandType.ChatInput,
            options: this.options.options.map((o) => o.toJSON())
        };
    }
}
