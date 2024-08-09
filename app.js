"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const homey_1 = __importDefault(require("homey"));
const Logger_1 = __importDefault(require("./lib/Logger"));
const Motion_1 = require("./lib/Motion");
class BrelHomeApp extends homey_1.default.App {
    /**
     * onInit is called when the app is initialized.
     */
    async onInit() {
        Logger_1.default.setLogger(this);
        this.mdriver = new Motion_1.MotionDriver(this, this.homey.clock.getTimezone());
        this.mdriver.verbose = true;
        this.mdriver.on('newDevices', () => {
            this.log('New devices found');
            this.log(this.mdriver.getDevices());
        });
        this.homey.clock.addListener('timezone', (timezone) => {
            this.log('Timezone changed to ' + timezone);
            this.mdriver.setTimezone(timezone ? this.homey.clock.getTimezone() : timezone);
        });
        const appKey = this.homey.settings.get('appKey');
        this.mdriver.setAppKey(appKey);
        this.mdriver.connect();
        this.log('Brel has been initialized');
    }
}
exports.default = BrelHomeApp;
module.exports = BrelHomeApp;
