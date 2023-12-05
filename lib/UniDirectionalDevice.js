"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseDevice_1 = __importDefault(require("./BaseDevice"));
const MessageFactory_1 = require("./messages/MessageFactory");
class UniDirectionalDevice extends BaseDevice_1.default {
    async onInit() {
        await super.onInit();
        const store = this.getStore();
        this.registerCapabilityListener("windowcoverings_state" /* Capability.State */, async (value) => {
            const operations = {
                'down': 0 /* Operation.Down */,
                'up': 1 /* Operation.Up */,
                'idle': 2 /* Operation.Idle */
            };
            this.log('Send operation ' + operations[value]);
            const message = MessageFactory_1.MessageFactory.createSetOperationMessage(store.hub.apiToken, store.mac, store.deviceType, operations[value]);
            await this.write(message);
        });
    }
}
exports.default = UniDirectionalDevice;
