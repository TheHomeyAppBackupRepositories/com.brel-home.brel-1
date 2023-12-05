"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const homey_rfdriver_1 = require("homey-rfdriver");
const BrelSignal_1 = __importDefault(require("../../lib/signals/BrelSignal"));
class MLE25Driver extends homey_rfdriver_1.RFDriver {
    onRFInit() {
        super.onRFInit();
        this.homey.flow.getActionCard('go-to-preferred-position')
            .registerRunListener(async (args, state) => {
            await args.device.goToPreferredPosition();
        });
    }
}
MLE25Driver.SIGNAL = BrelSignal_1.default;
module.exports = MLE25Driver;
