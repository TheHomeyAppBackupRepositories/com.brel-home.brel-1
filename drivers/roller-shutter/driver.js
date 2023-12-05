"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseDriver_1 = __importDefault(require("../../lib/BaseDriver"));
class RollerShutterDriver extends BaseDriver_1.default {
    getMotorType() {
        return 6 /* MotorType["Roller Shutter"] */;
    }
}
module.exports = RollerShutterDriver;
