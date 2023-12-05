"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseDriver_1 = __importDefault(require("../../lib/BaseDriver"));
class HoneycombBlindsDriver extends BaseDriver_1.default {
    getMotorType() {
        return 4 /* MotorType["Honeycomb Blinds"] */;
    }
}
module.exports = HoneycombBlindsDriver;
