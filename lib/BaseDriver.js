"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const homey_1 = __importDefault(require("homey"));
const Constants_1 = require("./Constants");
class BaseDriver extends homey_1.default.Driver {
    constructor() {
        super(...arguments);
        this.mdriver = this.homey.app.mdriver;
    }
    /**
     * onInit is called when the driver is initialized.
     */
    async onInit() {
        this.log('Driver has been initialized');
    }
    async onPair(session) {
        session.setHandler('showView', async (viewId) => {
            // Skip the access token view if one is already set
            // TODO: allow user to change the key (in settings?)
            if (viewId === 'enter_access_token' && this.mdriver.hasAppKey()) {
                this.log('Skipping access token view because key is already set');
                await session.nextView();
            }
        });
        session.setHandler('access_token_entered', async (data) => {
            this.log('Access token entered');
            // TODO: only set/ask for key once!
            if (data.token && data.token.length === 16) {
                this.mdriver.setAppKey(data.token);
            }
        });
        session.setHandler('list_devices', async () => {
            const devices = this.mdriver
                .getDevices(this.getDeviceType(), (id) => {
                if (id.registered) {
                    return false;
                }
                if (id.type !== null && id.type !== this.getMotorType()) {
                    return false;
                }
                return true;
            });
            const alreadyPaired = this.getDevices().map(device => device.getData().mac);
            return devices
                .filter(device => !alreadyPaired.includes(device.mac))
                .map(device => this.createDeviceListing(device));
        });
    }
    createDeviceListing(device) {
        this.log('Creating device listing for ' + device.mac);
        return {
            name: device.type ? Constants_1.DeviceTypeToNameMap[device.type] : "Blind",
            data: {
                id: device.mac,
                mac: device.mac,
                deviceType: device.deviceType
            }
        };
    }
    getDeviceType() {
        return "10000000" /* DeviceType.Blind */;
    }
}
exports.default = BaseDriver;
module.exports = BaseDriver;
