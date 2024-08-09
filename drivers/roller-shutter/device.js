"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseDevice_1 = __importDefault(require("../../lib/BaseDevice"));
class RollerShutterDevice extends BaseDevice_1.default {
    async onInit() {
        await this.addCapability("windowcoverings_tilt_set" /* Capability.Tilt */);
        await super.onInit();
    }
}
module.exports = RollerShutterDevice;
