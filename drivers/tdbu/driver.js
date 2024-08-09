"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TDBUDriver = void 0;
const BaseDriver_1 = __importDefault(require("../../lib/BaseDriver"));
class TDBUDriver extends BaseDriver_1.default {
    async onInit() {
        await super.onInit();
        this.topPositionChangedTrigger = this.homey.flow.getDeviceTriggerCard("top-position-changed" /* TDBUTriggers.TopPositionChanged */);
        this.bottomPositionChangedTrigger = this.homey.flow.getDeviceTriggerCard("bottom-position-changed" /* TDBUTriggers.BottomPositionChanged */);
        this.homey.flow.getActionCard("set-top-position-to" /* TDBUActions.SetTopPositionTo */)
            .registerRunListener((args, _) => {
            return args.device.triggerCapabilityListener("brel_top_position" /* Capability.Top */, args.position, {});
        });
        this.homey.flow.getActionCard("set-bottom-position-to" /* TDBUActions.SetBottomPositionTo */)
            .registerRunListener((args, _) => {
            return args.device.triggerCapabilityListener("brel_bottom_position" /* Capability.Bottom */, args.position, {});
        });
    }
    getDeviceType() {
        return "10000001" /* DeviceType.TopDownBottomUp */;
    }
    getMotorType() {
        return 9 /* MotorType.TDBU */;
    }
    triggerTopPositionChanged(device) {
        return this.topPositionChangedTrigger.trigger(device, {}, {});
    }
    triggerBottomPositionChanged(device) {
        return this.bottomPositionChangedTrigger.trigger(device, {}, {});
    }
}
exports.TDBUDriver = TDBUDriver;
module.exports = TDBUDriver;
