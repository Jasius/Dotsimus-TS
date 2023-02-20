import './utils/functions/validateEnv.js';

import { DotsimusClient } from './structures/DotsimusClient.js';

const client = new DotsimusClient();
await client.start();
