module.exports = {
	apps: [
		{
			name: 'dotsimus-ts',
			script: 'node',
			args: './build',
			instances: 1,
			env_production: {
				NODE_ENV: 'production',
			},
			env_development: {
				NODE_ENV: 'development',
			},
			out_file: './logs/out.log',
			error_file: './logs/err.log',
		},
	],
};
