module.exports = {
    apps: [
        {
            name: 'dotsimus-ts',
            script: 'node',
            args: '--experimental-specifier-resolution=node ./build',
            instances: 1,
            env_production: {
                NODE_ENV: 'production'
            },
            env_development: {
                NODE_ENV: 'development'
            },
            out_file: './logs/out.log',
            error_file: './logs/err.log'
        }
    ]
};
