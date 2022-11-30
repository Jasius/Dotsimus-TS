import { z } from 'zod';

(function () {
    const ProcessEnv = z.object({
        NODE_ENV: z.string().regex(/^(production|development)$/),
        DISCORD_TOKEN: z.string(),
        TOPGG_TOKEN: z.string().optional()
    });

    ProcessEnv.parse(process.env);
})();
