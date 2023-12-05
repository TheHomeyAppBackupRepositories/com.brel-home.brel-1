"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const homey_1 = __importDefault(require("homey"));
const WriteSession_1 = __importDefault(require("./messages/WriteSession"));
class BaseDevice extends homey_1.default.Device {
    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        // Note: children of this class do most of the work.
        this.log('Device has been initialized');
    }
    async write(message) {
        const session = new WriteSession_1.default();
        const result = await session.send(message);
        if (result) {
            try {
                const parsed = JSON.parse(result);
                if (parsed.hasOwnProperty('actionResult')) {
                    this.log(`Received action result: ${parsed['actionResult']}`);
                }
                else if (parsed.hasOwnProperty('data')) {
                    this.log(parsed['data']);
                }
                else {
                    this.log(parsed);
                }
            }
            catch (_) {
                this.log(result);
            }
        }
    }
}
exports.default = BaseDevice;
module.exports = BaseDevice;
