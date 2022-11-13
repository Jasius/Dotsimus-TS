import Joi from 'joi';

(() => {
    const schema = Joi.object()
        .keys({
            NODE_ENV: Joi.string().valid('development', 'production').required(),
            DISCORD_TOKEN: Joi.string().required(),
            TOPGG_TOKEN: Joi.string().optional()
        })
        .unknown();

    const { error } = schema.prefs({ errors: { label: 'key' } }).validate(process.env);

    if (error) throw new Error(error.message);
})();
