"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TDBUDevice = void 0;
const BaseDevice_1 = __importDefault(require("../../lib/BaseDevice"));
class TDBUDevice extends BaseDevice_1.default {
    async addCapabilities() {
        // For now, remove the battery capability and support it another time.
        if (this.hasCapability("measure_battery" /* Capability.Battery */)) {
            await this.removeCapability("measure_battery" /* Capability.Battery */);
        }
        if (!this.hasCapability("brel_top_position" /* Capability.Top */)) {
            this.log('Adding TDBU top capability');
            await this.addCapability("brel_top_position" /* Capability.Top */);
        }
        if (!this.hasCapability("brel_bottom_position" /* Capability.Bottom */)) {
            this.log('Adding TDBU bottom capability');
            await this.addCapability("brel_bottom_position" /* Capability.Bottom */);
        }
    }
    async onReport(report) {
        if (!report.data) {
            return;
        }
        if (report.data.currentPosition_T) {
            await this.setCapabilityValue("brel_top_position" /* Capability.Top */, report.data.currentPosition_T);
        }
        if (report.data.currentPosition_B) {
            await this.setCapabilityValue("brel_bottom_position" /* Capability.Bottom */, report.data.currentPosition_B);
        }
    }
    registerCapabilityListeners() {
        this.registerCapabilityListener("brel_top_position" /* Capability.Top */, async (percentage) => {
            let bottom = this.getCapabilityValue("brel_bottom_position" /* Capability.Bottom */);
            // Don't allow top to go below bottom.
            if (bottom < percentage) {
                this.log('SET TOP - CORRECTING', bottom, percentage);
                bottom = percentage;
            }
            await this.writeTdbuPositions(percentage, bottom);
        });
        this.registerCapabilityListener("brel_bottom_position" /* Capability.Bottom */, async (percentage) => {
            let top = this.getCapabilityValue("brel_top_position" /* Capability.Top */);
            // Don't allow bottom to go above top.
            if (top > percentage) {
                this.log('SET BOTTOM - CORRECTING', top, percentage);
                top = percentage;
            }
            await this.writeTdbuPositions(top, percentage);
        });
    }
    async writeTdbuPositions(topPercentage, bottomPercentage) {
        await this.writeToDevice({
            targetPosition_T: topPercentage,
            targetPosition_B: bottomPercentage
        });
    }
}
exports.TDBUDevice = TDBUDevice;
module.exports = TDBUDevice;
