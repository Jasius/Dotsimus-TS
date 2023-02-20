import pino from 'pino';

import { isProd } from '../../constants.js';

const prettyConfig: pino.LoggerOptions = {
	level: 'debug',
	transport: {
		target: 'pino-pretty',
		options: {
			translateTime: 'yyyy-mm-dd HH:MM:ss Z',
			ignore: 'pid,hostname',
		},
	},
};

const logger = pino(isProd ? {} : prettyConfig);

export default logger;
