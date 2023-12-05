"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseDriver_1 = __importDefault(require("../../lib/BaseDriver"));
class AwningDriver extends BaseDriver_1.default {
    getMotorType() {
        return 8 /* MotorType.Awning */;
    }
}
module.exports = AwningDriver;
