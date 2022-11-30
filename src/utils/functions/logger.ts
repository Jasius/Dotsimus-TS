import pino from 'pino';

import { isProd } from '../../constants';

const logger = pino({
    level: isProd ? 'info' : 'debug',
    transport: {
        target: 'pino-pretty',
        options: {
            translateTime: 'yyyy-mm-dd HH:MM:ss Z',
            ignore: 'pid,hostname'
        }
    }
});

export default logger;
