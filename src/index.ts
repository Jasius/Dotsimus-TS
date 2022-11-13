import 'dotenv/config';
import './utils/validateEnv';

import { DotsimusClient } from './structures/DotsimusClient';

const client = new DotsimusClient();
await client.start();
