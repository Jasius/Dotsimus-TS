declare module NodeJS {
	interface ProcessEnv {
		readonly NODE_ENV: 'development' | 'production';
		readonly DATABASE_URL: string;
		readonly DISCORD_TOKEN: string;
		readonly OWNER_ID: string;
		readonly PERSPECTIVE_KEY: string;
		readonly TOPGG_TOKEN?: string;
	}
}
