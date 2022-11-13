export class Event {
    client;
    name;
    once;
    constructor(client, options) {
        this.client = client;
        this.name = options.name;
        this.once = options.once;
    }
}
