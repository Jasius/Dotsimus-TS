import { ColorResolvable, HexColorString } from 'discord.js';
import path from 'node:path';

import type { Command } from '../structures/Command';
import type { Component } from '../structures/Component';
import type { ContextMenu } from '../structures/ContextMenu';
import type { DotsimusClient } from '../structures/DotsimusClient';
import type { Event } from '../structures/Event';

export class ClientUtils {
    client: DotsimusClient;

    constructor(client: DotsimusClient) {
        this.client = client;
    }

    async importStructure<T extends Command | Component | ContextMenu | Event>(file: string): Promise<T | null> {
        try {
            const filePath = path.resolve(process.cwd(), file);
            const fileURL = new URL('file:///' + filePath);
            const File = (await import(fileURL.href)).default;

            return new File(this.client);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.client.logger.error(`${file.split('/').pop()}: ${message}`);

            return null;
        }
    }

    getRandomColor(input: string): ColorResolvable {
        const h = [...input].reduce((acc, char) => {
                return char.charCodeAt(0) + ((acc << 5) - acc);
            }, 0),
            s = 95,
            l = 35 / 100,
            a = (s * Math.min(l, 1 - l)) / 100,
            f = (n: number) => {
                const k = (n + h / 30) % 12,
                    color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                return Math.round(255 * color)
                    .toString(16)
                    .padStart(2, '0');
            };
        return `#${f(0)}${f(8)}${f(4)}`;
    }
}
