import { ApplicationCommandType, InteractionResponse, Message } from 'discord.js';

export interface ActiveUser {
	userId: string;
	guildId: string;
	typingTimestamp: number;
}

export type CommandResponse = Message | InteractionResponse;
