"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UdpMulticastSocket_1 = __importDefault(require("../UdpMulticastSocket"));
const Constants_1 = require("../Constants");
class WriteSession {
    send(message) {
        return new Promise((res, _) => {
            const socket = new UdpMulticastSocket_1.default(Constants_1.ConnectionInformation.Address, Constants_1.ConnectionInformation.Port);
            let timeout;
            socket.onMessage((message, _) => {
                clearTimeout(timeout);
                res(message.toString());
            });
            socket.send(message);
            timeout = setTimeout(() => {
                res(null);
            }, WriteSession.AckTimeout);
        });
    }
}
exports.default = WriteSession;
WriteSession.AckTimeout = 750;
