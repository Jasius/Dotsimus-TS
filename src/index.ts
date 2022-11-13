import 'dotenv/config';

import { DotsimusClient } from './structures/DotsimusClient';

const client = new DotsimusClient();
await client.start();
