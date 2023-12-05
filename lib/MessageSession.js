"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageSession = void 0;
const UdpMulticastSocket_1 = __importDefault(require("./UdpMulticastSocket"));
const Constants_1 = require("./Constants");
const Logger_1 = __importDefault(require("./Logger"));
class MessageSession {
    constructor() {
        this.responses = [];
    }
    async sendAndReceiveAsync(message, timeout) {
        Logger_1.default.log(`Starting message session for ${message.msgType}, taking ${timeout}ms (${message.msgID})`);
        if (timeout <= 0) {
            Logger_1.default.error('MessageSession cannot have a timout that is zero or less');
            return Promise.reject('Timeout is zero or less');
        }
        return new Promise((res, rej) => {
            const server = new UdpMulticastSocket_1.default(Constants_1.ConnectionInformation.Address, Constants_1.ConnectionInformation.Port);
            let startedListening = false;
            server.onReady(() => {
                startedListening = true;
                server.sendTwice(message, timeout / 2);
                setTimeout(() => {
                    Logger_1.default.log(`Finished message session with ${this.responses.length} response(s)`);
                    res(this.responses);
                }, timeout);
            });
            server.onMessage((message, remote) => this.onMessage(message, remote));
            // Prevent us getting stuck if the listener never opens.
            setTimeout(() => {
                if (!startedListening)
                    rej();
            }, timeout * 3);
        });
    }
    onMessage(message, remote) {
        Logger_1.default.log(`Received message on message session`);
        this.responses.push([
            remote,
            JSON.parse(message.toString('utf8'))
        ]);
    }
}
exports.MessageSession = MessageSession;
