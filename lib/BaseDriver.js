"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const homey_1 = __importDefault(require("homey"));
const Constants_1 = require("./Constants");
const HubDiscoveryService_1 = __importDefault(require("./hubs/HubDiscoveryService"));
const Hub_1 = require("./hubs/Hub");
const CapabilitiesFactory_1 = __importDefault(require("./CapabilitiesFactory"));
const Parallel_1 = __importDefault(require("./Parallel"));
class BaseDriver extends homey_1.default.Driver {
    /**
     * onInit is called when the driver is initialized.
     */
    async onInit() {
        this.log('Driver has been initialized');
    }
    async onPair(session) {
        let accessToken = null;
        session.setHandler('access_token_entered', async (data) => {
            this.log('Access token entered');
            accessToken = data.token;
        });
        session.setHandler('list_devices', async () => {
            this.log('list_devices called, starting discovery process');
            const discoveryResults = await HubDiscoveryService_1.default.discover();
            const listing = await (0, Parallel_1.default)(Object.keys(discoveryResults), async (ip) => {
                this.log('Found hub at ' + ip);
                const hub = await Hub_1.Hub.createFromDiscovery(ip, discoveryResults[ip], accessToken);
                // This driver instance is for a specific motor type; get all motors
                // we are interested in.
                return hub
                    .getDevicesByMotorType(this.getMotorType())
                    .map(device => this.createDeviceListing(hub, device));
            });
            return listing.flat();
        });
    }
    createDeviceListing(hub, device) {
        this.log('Creating device listing for ' + device.mac);
        return {
            name: Constants_1.DeviceTypeToNameMap[device.deviceType],
            data: {
                id: device.mac
            },
            capabilities: CapabilitiesFactory_1.default.getCapabilitiesForDevice(device),
            store: {
                mac: device.mac,
                deviceType: device.deviceType,
                hub: {
                    apiToken: hub.getApiToken(),
                    ip: hub.getIP()
                }
            }
        };
    }
}
exports.default = BaseDriver;
module.exports = BaseDriver;
