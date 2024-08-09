"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const homey_1 = __importDefault(require("homey"));
class BaseDevice extends homey_1.default.Device {
    constructor() {
        super(...arguments);
        this.mdriver = this.homey.app.mdriver;
        this.onReportHandler = (data) => {
            if (data.mac === this.getData().mac) {
                this.onReport(data)
                    .catch(error => this.error(error));
            }
        };
        this.onNewDevice = (mac) => {
            if (mac === this.getData().mac) {
                this.log('New device found, registering device ' + mac);
                this.registerDevice()
                    .catch(error => this.error(error));
                ;
            }
        };
        this.onReadDeviceAck = (data) => {
            if (data.mac === this.getData().mac) {
                this.onReport(data)
                    .catch(error => this.error(error));
                ;
            }
        };
    }
    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        // Driver event handlers
        this.mdriver.on('Report', this.onReportHandler);
        this.mdriver.on('newDevice', this.onNewDevice);
        this.mdriver.on('ReadDeviceAck', this.onReadDeviceAck);
        // Capabilities
        await this.addCapabilities();
        this.registerCapabilityListeners();
        // Finalization
        this.registerDevice()
            .catch(error => this.error(error));
        this.log('Device has been initialized');
    }
    async onDeleted() {
        this.mdriver.off('Report', this.onReportHandler);
        this.mdriver.off('newDevice', this.onNewDevice);
        this.mdriver.off('ReadDeviceAck', this.onReadDeviceAck);
        this.mdriver.unregisterDevice(this.getData().mac);
    }
    async addCapabilities() {
        if (!this.hasCapability("windowcoverings_set" /* Capability.Set */)) {
            this.log('Adding set capability');
            await this.addCapability("windowcoverings_set" /* Capability.Set */);
        }
        if (!this.hasCapability("windowcoverings_state" /* Capability.State */)) {
            this.log('Adding state capability');
            await this.addCapability("windowcoverings_state" /* Capability.State */);
        }
    }
    registerCapabilityListeners() {
        this.registerCapabilityListener("windowcoverings_state" /* Capability.State */, async (value) => {
            await this.writeState(value);
        });
        this.registerCapabilityListener("windowcoverings_set" /* Capability.Set */, async (value) => {
            await this.writePosition(value);
        });
        this.registerCapabilityListener("windowcoverings_tilt_set" /* Capability.Tilt */, async (value) => {
            await this.writeTilt(value);
        });
    }
    async onReport(report) {
        if (!report.data) {
            return;
        }
        await this.handleStateAndPercentage(report);
        await this.handleBattery(report);
    }
    async handleStateAndPercentage(report) {
        let state = null;
        let percentage = null;
        switch (report.data.operation) {
            case this.mdriver.Operation.Close_Down:
                state = 'down';
                percentage = 0;
                break;
            case this.mdriver.Operation.Open_Up:
                state = 'up';
                percentage = 1;
                break;
            case this.mdriver.Operation.Stop:
                state = 'idle';
                break;
        }
        if (report.data.targetPosition) {
            percentage = this.mdriver.positionToPercentageOpen(report.data.targetPosition);
            state = this.travelDirection(percentage, this.getCapabilityValue("windowcoverings_set" /* Capability.Set */), true);
        }
        else if (report.data.currentPosition) {
            percentage = this.mdriver.positionToPercentageOpen(report.data.currentPosition);
            state = this.travelDirection(report.data.currentPosition, this.getCapabilityValue("windowcoverings_set" /* Capability.Set */));
        }
        if (state && this.hasCapability("windowcoverings_state" /* Capability.State */)) {
            this.log('Setting state to ' + state);
            await this.setCapabilityState(state);
        }
        if (percentage && this.hasCapability("windowcoverings_set" /* Capability.Set */)) {
            this.log('Setting set percentage to ' + percentage * 100);
            await this.setCapabilityPercentage(percentage);
        }
    }
    async handleBattery(report) {
        // TODO: handle TDBU
        if (!report.data.batteryLevel) {
            return;
        }
        if (!this.hasCapability("measure_battery" /* Capability.Battery */)) {
            this.log('Adding battery capability');
            await this.addCapability("measure_battery" /* Capability.Battery */);
        }
        const percentage = this.mdriver.batteryLevelToPercentage(report.data.batteryLevel);
        const current = this.getCapabilityValue("measure_battery" /* Capability.Battery */);
        if (!current || this.numberDifferent(percentage, current, 0.5)) {
            this.log('Setting battery level to ' + percentage);
            await this.setCapabilityValue("measure_battery" /* Capability.Battery */, percentage);
        }
    }
    async registerDevice() {
        const data = this.getData();
        if (this.mdriver.registerDevice(data.mac)) {
            await this.mdriver.writeStatusRequest(data.mac, data.deviceType);
        }
    }
    travelDirection(newPercentage, oldPercentage, noIdle = false) {
        if (!this.numberDifferent(newPercentage, oldPercentage, 0.05)) {
            return noIdle ? undefined : 'idle';
        }
        return newPercentage > oldPercentage ? 'up' : 'down';
    }
    numberDifferent(newValue, oldValue, threshold) {
        return Math.abs(oldValue - newValue) >= threshold;
    }
    async setCapabilityState(state) {
        // TODO: support TDBU
        if (this.getCapabilityValue("windowcoverings_state" /* Capability.State */) !== state) {
            await this.setCapabilityValue("windowcoverings_state" /* Capability.State */, state)
                .catch(error => this.error(error));
        }
    }
    async setCapabilityPercentage(percentage) {
        if (!this.hasCapability("windowcoverings_set" /* Capability.Set */)) {
            return;
        }
        // TODO: do we need this 0.05 threshold?
        const current = this.getCapabilityValue("windowcoverings_set" /* Capability.Set */);
        if (current && this.numberDifferent(percentage, current, 0.05)) {
            await this.setCapabilityValue("windowcoverings_set" /* Capability.Set */, percentage)
                .catch(error => this.error(error));
        }
    }
    async setCapabilityTilt(percentage) {
        if (!this.hasCapability("windowcoverings_tilt_set" /* Capability.Tilt */)) {
            return;
        }
        const current = this.getCapabilityValue("windowcoverings_tilt_set" /* Capability.Tilt */);
        if (current && this.numberDifferent(percentage, current, 0.05)) {
            await this.setCapabilityValue("windowcoverings_tilt_set" /* Capability.Tilt */, percentage)
                .catch(error => this.error(error));
        }
    }
    async writeState(state) {
        // TODO: support TDBU
        switch (state) {
            case 'up':
                await this.setCapabilityState('up');
                await this.writeToDevice({ operation: this.mdriver.Operation.Open_Up });
                break;
            case 'down':
                await this.setCapabilityState('down');
                await this.writeToDevice({ operation: this.mdriver.Operation.Close_Down });
                break;
            case 'idle':
                await this.setCapabilityState('idle');
                await this.writeToDevice({ operation: this.mdriver.Operation.Stop });
                break;
        }
    }
    async writePosition(percentage) {
        let position = this.mdriver.percentageOpenToPosition(percentage);
        if (this.mdriver.verbose) {
            this.log("Setting position to " + position);
        }
        switch (position) {
            case this.mdriver.Operation.Open_Up:
                await this.setCapabilityState('up');
                break;
            case this.mdriver.Operation.Close_Down:
                await this.setCapabilityState('down');
                break;
            default:
                const travelDirection = this.travelDirection(position, this.getCapabilityValue("windowcoverings_set" /* Capability.Set */));
                if (this.mdriver.verbose) {
                    this.log("Setting travel direction to " + travelDirection);
                }
                await this.setCapabilityState(travelDirection);
                break;
        }
        await this.setCapabilityPercentage(percentage);
        if (this.getSetting('inverted')) {
            position = Math.abs(position - 100);
        }
        await this.writeToDevice({ targetPosition: position });
    }
    async writeTilt(percentage) {
        // TODO: max angle -> double roller close?
        const angle = this.mdriver.percentageTiltToAngle(percentage, this.mdriver.Angle.Close);
        if (this.mdriver.verbose) {
            this.log(`Setting tilt to ${angle} (${percentage}%)`);
        }
        await this.setCapabilityTilt(percentage);
        await this.writeToDevice({ targetAngle: angle });
    }
    async writeToDevice(message) {
        if (this.mdriver.verbose) {
            this.log("Writing to device:", message);
        }
        const data = this.getData();
        await this.mdriver.send({
            "msgType": 'WriteDevice',
            "mac": data.mac,
            "deviceType": data.deviceType,
            "accessToken": this.mdriver.getAccessToken(data.mac, data.deviceType),
            "msgID": this.mdriver.getMessageID(),
            "data": message
        });
    }
}
exports.default = BaseDevice;
module.exports = BaseDevice;
