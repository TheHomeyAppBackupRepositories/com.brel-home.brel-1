"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseDevice_1 = __importDefault(require("./BaseDevice"));
const MessageFactory_1 = require("./messages/MessageFactory");
const MessageSession_1 = require("./MessageSession");
const BatteryLevel_1 = __importDefault(require("./BatteryLevel"));
class BiDirectionalDevice extends BaseDevice_1.default {
    async onInit() {
        await super.onInit();
        // Migrate; add battery capability.
        if (!this.hasCapability("measure_battery" /* Capability.Battery */)) {
            this.log(`Migration; adding ${"measure_battery" /* Capability.Battery */} capability`);
            await this.addCapability("measure_battery" /* Capability.Battery */);
        }
        const store = this.getStore();
        this.registerCapabilityListener("windowcoverings_set" /* Capability.Set */, async (value) => {
            await this.writePosition(value, store);
        });
        // In the future, more devices with both *_set and *_tilt might be supported,
        // so it is practical to support this here.
        if (this.hasCapability("windowcoverings_tilt_set" /* Capability.Tilt */)) {
            this.registerCapabilityListener("windowcoverings_tilt_set" /* Capability.Tilt */, async (value) => {
                await this.writeAngle(value, store);
            });
        }
        // Read status of bi-directional device.
        this.log(`Reading device status: ${store.mac}`);
        await this.readAndUpdatePositions(store);
        this.refreshInterval = this.homey.setInterval(async () => {
            await this.readAndUpdatePositions(store);
        }, BiDirectionalDevice.BATTERY_POLL_INTERVAL);
    }
    onDeleted() {
        this.homey.clearInterval(this.refreshInterval);
    }
    async writePosition(value, store) {
        const inverted = this.getSetting('inverted');
        if (inverted) {
            value = Math.abs(value - 1);
            this.log('Set position to ' + (value * 100) + ' (inverted)');
        }
        else {
            this.log('Set position to ' + value * 100);
        }
        const message = MessageFactory_1.MessageFactory.createWriteTargetPositionMessage(store.hub.apiToken, store.mac, store.deviceType, 
        // Is multiplied in MessageFactory
        value);
        await this.write(message);
    }
    async writeAngle(value, store) {
        this.log('Set tilt to ' + (value * 180).toFixed(0));
        const message = MessageFactory_1.MessageFactory.createWriteAngleMessage(store.hub.apiToken, store.mac, store.deviceType, 
        // Is multiplied in MessageFactory
        value);
        await this.write(message);
    }
    async readAndUpdatePositions(store) {
        try {
            const result = await this.readDeviceStatus(store);
            if (result.length === 0) {
                this.log(`Device with mac ${store.mac} did not respond.`);
            }
            const readResponse = result[0][1];
            if (!this.hasCapability("measure_battery" /* Capability.Battery */)) {
                this.log(`Adding ${"measure_battery" /* Capability.Battery */} capability`);
                await this.addCapability("measure_battery" /* Capability.Battery */);
            }
            const batteryLevel = (0, BatteryLevel_1.default)(readResponse.data.batteryLevel / 100);
            this.log(`Battery level: ${batteryLevel}%`);
            await this.setCapabilityValue("measure_battery" /* Capability.Battery */, batteryLevel);
            this.log(`(${store.mac}) Current position: ${readResponse.data.currentPosition / 100}`);
            await this.setCapabilityValue("windowcoverings_set" /* Capability.Set */, readResponse.data.currentPosition / 100);
            if (this.hasCapability("windowcoverings_tilt_set" /* Capability.Tilt */)) {
                this.log(`(${store.mac}) Current tilt: ${readResponse.data.currentAngle / 180}`);
                await this.setCapabilityValue("windowcoverings_tilt_set" /* Capability.Tilt */, readResponse.data.currentAngle / 180);
            }
        }
        catch (e) {
            this.log(`Could not read status of device ${store.mac}: ${e}`);
        }
    }
    async readDeviceStatus(store) {
        const timeout = 2000;
        const session = new MessageSession_1.MessageSession();
        return await session.sendAndReceiveAsync(MessageFactory_1.MessageFactory.createReadDeviceMessage(store.hub.apiToken, store.mac, store.deviceType), timeout);
    }
}
exports.default = BiDirectionalDevice;
BiDirectionalDevice.BATTERY_POLL_INTERVAL = 10 * 60 * 1000; // 10 minutes.
