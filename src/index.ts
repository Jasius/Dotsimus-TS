import 'dotenv/config';
import './utils/functions/validateEnv';

import { DotsimusClient } from './structures/DotsimusClient';

const client = new DotsimusClient();
await client.start();
