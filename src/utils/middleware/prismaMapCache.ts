import { Prisma } from '@prisma/client';

interface Instance {
    model: Prisma.ModelName;
    field: string;
}

const prismaQueryActions = ['findUnique', 'findMany', 'findFirst', 'queryRaw', 'aggregate', 'count', 'findRaw'];

export function createPrismaMapCache({ cache, models }: { cache: Map<string, any>; models: Prisma.ModelName[] }) {
    const middleware: Prisma.Middleware = async (params, next) => {
        for (const model of models) {
            if (params.model === model) {
                const { where } = params.args;

                if (!where) return next(params);

                const cacheKey = `${model}_${JSON.stringify(where)}`;
                const cached = cache.get(cacheKey);

                if (cached && prismaQueryActions.includes(params.action)) return cached;

                const result = await next(params);
                cache.set(cacheKey, result);

                return result;
            }
        }
    };

    return middleware;
}
