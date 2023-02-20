declare module NodeJS {
	interface ProcessEnv {
		readonly NODE_ENV: 'development' | 'production';
		readonly DISCORD_TOKEN: string;
		readonly TOPGG_TOKEN?: string;
	}
}
