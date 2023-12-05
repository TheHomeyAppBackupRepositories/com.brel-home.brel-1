"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hub = void 0;
const crypto_1 = __importDefault(require("crypto"));
const MessageSession_1 = require("../MessageSession");
const MessageFactory_1 = require("../messages/MessageFactory");
const Parallel_1 = __importDefault(require("../Parallel"));
const Logger_1 = __importDefault(require("../Logger"));
class Hub {
    constructor(ip, devices, apiToken) {
        this.devices = [];
        this.ip = ip;
        this.devices = devices;
        this.apiToken = apiToken;
    }
    static async createFromDiscovery(ip, discovery, accessToken) {
        const apiToken = this.createApiToken(accessToken, discovery.token);
        const devices = await (0, Parallel_1.default)(
        // The bridge will report itself as a device, we don't want to read it.
        discovery.data.filter(entry => entry.deviceType !== "02000001" /* DeviceType.WifiBridge */), async (entry) => {
            const session = new MessageSession_1.MessageSession();
            const result = await session.sendAndReceiveAsync(MessageFactory_1.MessageFactory.createReadDeviceMessage(apiToken, entry.mac, entry.deviceType), Hub.ReadTimeout);
            if (result.length == 0) {
                return null;
            }
            const readResult = result[0][1];
            return {
                deviceType: readResult.deviceType,
                motorType: readResult.data.type,
                wirelessMode: readResult.data.wirelessMode,
                mac: readResult.mac
            };
        });
        Logger_1.default.log("Found devices: " + JSON.stringify(devices));
        return new Hub(ip, devices, apiToken);
    }
    getIP() {
        return this.ip;
    }
    getApiToken() {
        return this.apiToken;
    }
    getDevices() {
        return this.devices;
    }
    getDevicesByMotorType(motorType) {
        return this.devices.filter(device => device.motorType === motorType);
    }
    static createApiToken(key, token) {
        const cipher = crypto_1.default.createCipheriv('aes-128-ecb', key, null);
        cipher.setAutoPadding(false);
        return Buffer.concat([cipher.update(token), cipher.final()])
            .toString('hex')
            .toUpperCase();
    }
}
exports.Hub = Hub;
Hub.ReadTimeout = 1000;
