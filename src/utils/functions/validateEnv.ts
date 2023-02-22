import 'dotenv/config';

import { z } from 'zod';

(function () {
	const ProcessEnv = z.object({
		NODE_ENV: z.string().regex(/^(production|development)$/),
		DATABASE_URL: z.string().url(),
		DISCORD_TOKEN: z.string(),
		OWNER_ID: z.string(),
		PERSPECTIVE_KEY: z.string(),
		TOPGG_TOKEN: z.string().optional(),
	});

	ProcessEnv.parse(process.env);
})();
