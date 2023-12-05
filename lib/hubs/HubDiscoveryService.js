"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MessageFactory_1 = require("../messages/MessageFactory");
const MessageSession_1 = require("../MessageSession");
const Logger_1 = __importDefault(require("../Logger"));
class HubDiscoveryService {
    async discover() {
        Logger_1.default.log('Started hub discovery.');
        const session = new MessageSession_1.MessageSession();
        const result = await session.sendAndReceiveAsync(MessageFactory_1.MessageFactory.createDiscoveryMessage(), HubDiscoveryService.DiscoveryTimeout);
        if (result.length > 0) {
            Logger_1.default.log(`Found ${result.length} hubs`);
        }
        else {
            Logger_1.default.log('Found no hubs');
        }
        return result.reduce((result, [{ address }, response]) => {
            result[address] = response;
            return result;
        }, {});
    }
}
HubDiscoveryService.DiscoveryTimeout = 3000;
exports.default = new HubDiscoveryService();
