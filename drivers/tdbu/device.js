"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TDBUDevice = void 0;
const BaseDevice_1 = __importDefault(require("../../lib/BaseDevice"));
const MessageFactory_1 = require("../../lib/messages/MessageFactory");
class TDBUDevice extends BaseDevice_1.default {
    async onInit() {
        await super.onInit();
        const store = this.getStore();
        this.registerCapabilityListener("brel_top_position" /* Capability.Top */, async (value) => {
            const inverted = this.getSetting('inverted');
            if (inverted) {
                value = Math.abs(value - 100);
                this.log('Set top position to ' + value + ' (inverted)');
            }
            else {
                this.log('Set top position to ' + value);
            }
            const message = MessageFactory_1.MessageFactory.createWriteTopPositionMessage(store.hub.apiToken, store.mac, store.deviceType, value);
            await this.write(message);
            await this.driver.triggerTopPositionChanged(this);
        });
        this.registerCapabilityListener("brel_bottom_position" /* Capability.Bottom */, async (value) => {
            const inverted = this.getSetting('inverted');
            if (inverted) {
                value = Math.abs(value - 100);
                this.log('Set bottom position to ' + value + ' (inverted)');
            }
            else {
                this.log('Set bottom position to ' + value);
            }
            const message = MessageFactory_1.MessageFactory.createWriteBottomPositionMessage(store.hub.apiToken, store.mac, store.deviceType, value);
            await this.write(message);
            await this.driver.triggerBottomPositionChanged(this);
        });
    }
}
exports.TDBUDevice = TDBUDevice;
module.exports = TDBUDevice;
