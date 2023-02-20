import { Prisma } from '@prisma/client';
import LRU from 'lru-cache';

const prismaQueryActions = ['findUnique', 'findMany', 'findFirst', 'queryRaw', 'aggregate', 'count', 'findRaw'];

interface MiddlewareOptions {
	cache: LRU<string, unknown>;
	models: Prisma.ModelName[];
}

export function createPrismaLRUCache({ cache, models }: MiddlewareOptions): Prisma.Middleware {
	return async function (params, next) {
		for (const model of models) {
			if (params.model !== model) continue;

			const { where } = params.args;

			if (!where) return next(params);

			const cacheKey = `${model}_${JSON.stringify(where)}`;
			const cached = cache.get(cacheKey);

			if (cached && prismaQueryActions.includes(params.action)) return cached;

			const result = await next(params);
			cache.set(cacheKey, result);

			return result;
		}
	};
}
