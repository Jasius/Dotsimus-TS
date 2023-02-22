import { ApplicationCommandType, InteractionResponse, Message } from 'discord.js';

export interface ActiveUser {
	userId: string;
	guildId: string;
	typingTimestamp: number;
}

export interface AnalyzedMessage {
	content: string;
	attributeScores: Toxicity;
}

export type CommandResponse = Message | InteractionResponse;
