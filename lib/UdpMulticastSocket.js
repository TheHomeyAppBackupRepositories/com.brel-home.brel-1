"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dgram_1 = __importDefault(require("dgram"));
const Logger_1 = __importDefault(require("./Logger"));
class UdpMulticastSocket {
    constructor(address, port) {
        this._address = address;
        this._port = port;
        this._socket = dgram_1.default.createSocket('udp4');
        this._socket.on('error', (error) => {
            Logger_1.default.error(error.message);
        });
        this.bind();
    }
    bind() {
        this._socket.bind(0, () => {
            this._socket.setBroadcast(true);
            this._socket.setMulticastTTL(128);
            this._socket.addMembership(this._address);
            this._socket.setMulticastLoopback(false);
        });
    }
    onReady(handler) {
        this._socket.on('listening', () => {
            Logger_1.default.log(`Listening on ${this._socket.address().address}:${this._socket.address().port}`);
            handler();
        });
    }
    onMessage(handler) {
        this._socket.on('message', handler);
    }
    clearHandler(handler) {
        this._socket.off('message', handler);
    }
    send(message) {
        const buffer = Buffer.from(JSON.stringify(message));
        this._socket.send(buffer, 0, buffer.length, this._port, this._address, (error, _) => {
            if (error) {
                Logger_1.default.error(error.message);
            }
        });
    }
    sendTwice(message, delay) {
        this.send(message);
        setTimeout(() => {
            this.send(message);
        }, delay);
    }
}
exports.default = UdpMulticastSocket;
