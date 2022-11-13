import path from 'node:path';
export class ClientUtil {
    client;
    constructor(client) {
        this.client = client;
    }
    async importStructure(file) {
        try {
            const filePath = path.resolve(process.cwd(), file);
            const fileURL = new URL('file:///' + filePath);
            const File = (await import(fileURL.href)).default;
            return new File(this.client);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.client.logger.error(`${file.split('/').pop()}: ${message}`);
            return null;
        }
    }
}
