"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MotionDriver = exports.MotionDevice = exports.MotionDeviceId = exports.MotionGateway = void 0;
const crypto_1 = __importDefault(require("crypto"));
const events_1 = __importDefault(require("events"));
const dgram_1 = __importDefault(require("dgram"));
const MULTICAST_ADDRESS = '238.0.0.18';
const UDP_PORT_SEND = 32100;
const UDP_PORT_RECEIVE = 32101;
class MotionGateway {
    constructor(mdriver, mac) {
        this.motionDriver = mdriver;
        this.mac = mac;
        this.gatewayAddress = null;
        this.accessToken = null;
        this.token = null;
        this.nrDevices = 0;
        this.key = mdriver.key;
    }
    calculateAccessToken() {
        try {
            if (this.key != null && this.token != null) {
                if (this.motionDriver.verbose) {
                    this.motionDriver.log('Key = "' + this.key + '", Token = "' + this.token + '"');
                }
                const cipher = crypto_1.default.createCipheriv('aes-128-ecb', this.key, null);
                let buff = Buffer.concat([cipher.update(this.token), cipher.final()]);
                let text = buff.toString('hex');
                let wasNotReady = this.accessToken == null;
                this.accessToken = text.substring(0, 32).toUpperCase();
                this.motionDriver.log('Access token set' + (this.motionDriver.verbose ? ' to "' + this.accessToken + '"' : ''));
                if (wasNotReady) {
                    this.motionDriver.onReady(this.mac);
                }
            }
            else if (this.accessToken != null) {
                this.accessToken = null;
                this.motionDriver.log('Access token cleared');
                this.motionDriver.onNotReady(this.mac);
            }
        }
        catch (err) {
            this.motionDriver.log('Error calculating Access Token for Key = "' + this.key + '", Token = "' + this.token + '"');
            this.motionDriver.log(err);
            this.accessToken = null;
            this.motionDriver.onNotReady(this.mac);
        }
    }
    setToken(newToken) {
        if (newToken && newToken != this.token) {
            this.token = newToken;
            this.calculateAccessToken();
        }
    }
    setAppKey(appKey) {
        if (appKey != this.key) {
            this.key = appKey;
            this.calculateAccessToken();
        }
    }
    setGatewayAddress(addr) {
        if (this.gatewayAddress != addr) {
            this.gatewayAddress = addr;
            return true;
        }
        return false;
    }
    isReady() {
        return this.accessToken != null;
    }
}
exports.MotionGateway = MotionGateway;
class MotionDeviceId {
    constructor(mac, deviceType) {
        this.type = null;
        this.wirelessMode = null;
        this.inGroup = false;
        this.mac = mac;
        this.deviceType = deviceType;
        this.registered = false;
    }
}
exports.MotionDeviceId = MotionDeviceId;
class MotionDevice {
    constructor(mac, deviceType, gateway) {
        this.id = new MotionDeviceId(mac, deviceType);
        this.gateway = gateway;
    }
}
exports.MotionDevice = MotionDevice;
/*
    This driver provides access to the Motion Wifi Gateways that are in your local network.
    Use the connect method to open communication with the gateways. The key provided can be retrieved from the Motion App:
    Quickly tap the 'Motion APP about' 5 times to get the key, it should have format of the following example: 74ae544c-d16e-4c

    You can listen to the following events (though there should not be any imminent need):

    'listening' The UDP socket is now listening
    'senderror' An error occurred during send
    'close' Cle UPD socket was closed
    'connect' The Motion Gateway is being connected
    'disconnect' The Motion Gateway is being disconnected
    'ready' The accesstoken is calculated for the gateway with the given mac, so you can write to its devices and/or get device states.
    'notReady' The accesstoken for the gateway with the given mac is no longer available (e.g. due to close or key reset)
    'newDevice' the device with the given mac is added
    'newDevices' One or more new device were detected

    Furthermote you can listen to all the msgTypes that the gateway supports.
    This is the preferred way of interacting with the MotionGateway.
    Refer to their API documentation for all the messages.

    This class provides the required accessToken (once ready) and messageID() to create the requests.
    Also, the gateway retreives the deviceList, so you can make use of it
    The deviceList should be there when the ready state is set, but in theory the heartbeat can come first,
    so it is wise to listen for the incoming 'GetDeviceListAck' message instead.
*/
class MotionDriver extends events_1.default {
    constructor(motionapp = null, timezone = null) {
        super();
        this.DeviceType = {
            Gateway: '02000001',
            ChildGateway: '02000002',
            Blind: '10000000',
            TopDownBottomUp: '10000001',
            DoubleRoller: '10000002'
        };
        this.BlindType = {
            RollerBlind: 1,
            VenetianBlind: 2,
            RomanBlind: 3,
            HoneycombBlind: 4,
            ShangriLaBlind: 5,
            RollerShutter: 6,
            RollerGate: 7,
            Awning: 8,
            TopDownBottomUp: 9,
            DayNightBlind: 10,
            DimmingBlind: 11,
            Curtain: 12,
            CurtainLeft: 13,
            CurtainRight: 14,
            DoubleRoller: 17,
            Switch: 43
        };
        this.Operation = {
            Close_Down: 0,
            Open_Up: 1,
            Stop: 2,
            StatusQuery: 5
        };
        this.Position = {
            Open_Up: 0,
            Close_Down: 100
        };
        this.Angle = {
            Open: 0,
            DR_Close: 90,
            Close: 180
        };
        this.LimitStatus = {
            NoLimits: 0,
            TopLimit: 1,
            BottomLimit: 2,
            Limits: 3,
            Limit3: 4
        };
        this.VoltageMode = {
            AC: 0,
            DC: 1
        };
        this.WirelessMode = {
            UniDirection: 0,
            BiDirection: 1,
            BidirectionMech: 2,
            Others: 3
        };
        this.setMaxListeners(50);
        this.app = motionapp; // using external reference somehow works better than Homey.app, which is undefined when this initialises?
        this.timezone = timezone;
        this.key = null;
        this.devices = new Map();
        this.logging = true;
        this.verbose = false;
        this.logHeartbeat = false;
        this.pollAgain = false;
        this.pollTimer = null;
        this.multicast = false;
        this.multisocket = false;
        this.ip = null;
        this.listening = false;
        this.client = null;
        this.server = null;
        this.lastMessageID = null;
        process.on('SIGTERM', () => this.disconnect());
    }
    log(msg) {
        if (!this.logging) {
            return;
        }
        if (this.app == null) {
            console.log(msg);
        }
        else {
            this.app.log(msg);
        }
    }
    error(msg) {
        if (this.app != null) {
            this.app.error(msg);
        }
        else {
            console.error(msg);
        }
    }
    setTimezone(timezone) {
        this.log('Timezone changed to ' + timezone);
        this.timezone = timezone;
    }
    checkMessageID(message) {
        try {
            if (message && message.msgID) {
                let id = BigInt(message.msgID);
                if (id > this.lastMessageID) {
                    if (this.verbose) {
                        this.log('incremented messageID from ' + this.lastMessageID + ' to ' + id);
                    }
                    this.lastMessageID = id;
                }
            }
        }
        catch (error) {
            this.error(error);
        }
    }
    getMessageID() {
        let id = new Date().toISOString().replace(/[T\-\./:Z]/g, '');
        if (this.timezone != null) {
            try {
                // homey has a UTC clock and no proper means to get the right timezone :-(
                let nowid = new Date().toLocaleString('sv', { timeZone: this.timezone }).replace(/[T\- \./:Z]/g, '');
                if (nowid.length < id.length) {
                    nowid = nowid + id.substring(nowid.length);
                }
                if (/^\d+$/.test(nowid)) {
                    id = nowid;
                }
            }
            catch (error) { // if this does not provide a suitable answer, proceed with old implementation
                this.log(error);
            }
        }
        try {
            let msgid = BigInt(id);
            if (this.lastMessageID != null && this.lastMessageID >= msgid) {
                msgid = this.lastMessageID + BigInt(1);
                id = msgid.toString();
                if (this.verbose) {
                    this.log('incremented messageID from ' + this.lastMessageID + ' to ' + id);
                }
            }
            this.lastMessageID = msgid;
        }
        catch (error) {
            this.log(error);
        }
        return id;
    }
    setIP(ip) {
        this.ip = ip == null || ip == '' ? null : ip;
        if (this.listening) {
            this.send({ "msgType": "GetDeviceList", "msgID": this.getMessageID() });
        }
    }
    setAppKey(appKey) {
        if (appKey != this.key) {
            this.log("Setting app key");
            this.key = appKey;
            for (let entry of this.devices.values()) {
                entry.gateway.setAppKey(appKey);
            }
        }
        // Store into Homey settings
        this.app.homey.settings.set('appKey', appKey);
    }
    hasAppKey() {
        return this.key != null;
    }
    getAccessToken(mac, deviceType) {
        let gateway = this.getGateway(mac, deviceType);
        if (gateway != undefined && gateway.isReady()) {
            return gateway.accessToken;
        }
        // fallback: hope / assume all gateways share the same token, the best guess is better than none.
        for (let entry of this.devices.values()) {
            if (entry.gateway.isReady()) {
                return entry.gateway.accessToken;
            }
        }
        return undefined;
    }
    percentageClosedToPosition(perc) {
        let pos = Math.round(perc * this.Position.Close_Down);
        return Math.max(Math.min(pos, this.Position.Close_Down), this.Position.Open_Up);
    }
    percentageOpenToPosition(perc) {
        return this.Position.Close_Down - this.percentageClosedToPosition(perc);
    }
    positionToPercentageClosed(pos) {
        let perc = Math.round(pos) / this.Position.Close_Down;
        return Math.min(Math.max(perc, 0), 1);
    }
    positionToPercentageOpen(pos) {
        return 1 - this.positionToPercentageClosed(pos);
    }
    angleToPercentageTilt(angle, max_tilt = this.Angle.Close) {
        let perc = Math.round(angle) / max_tilt;
        return 1 - Math.min(Math.max(perc, 0), 1);
    }
    percentageTiltToAngle(perc, max_tilt = this.Angle.Close) {
        let angle = Math.round(perc * max_tilt);
        return max_tilt - Math.max(Math.min(angle, max_tilt), this.Angle.Open);
    }
    batteryLevelToPercentage(level) {
        let voltage = level / 100;
        // estimate nr of cells, min is 3.2 and max is 4.2 per cell, will work ok for about 2 to 4 cells
        let cells = Math.round(voltage / 3.7);
        // minimum voltage, actual empty is 3.2, but below 3.3 to 3.4 average cells usually drop very rapidly, so assume empty early rather than late.
        let min = 3.35 * cells;
        // maximum voltage when fully charged. Should be 4.2 but Motion blinds seem to be charged less, which prolongs life. Also one expects to charge to full.
        let max = 4.05 * cells;
        // this assumes linear, which isn't true but will do until around 3.4 volt per cell, and average is now 3.7 which is usually true for most cells.
        let perc = Math.round((voltage - min) * 100 / (max - min));
        return Math.min(100, Math.max(perc, 0));
    }
    /**
     * Use mac to find getGateway by its mac, or add one if the deviceType is for a gateway, and it isn't found yet.
     * If mac is null or undefined, it returns undefined, otherwise it returns a MotionGateway (either new or existing)
     */
    getGateway(mac, deviceType) {
        if (mac === undefined) {
            return undefined;
        }
        let item = this.devices.get(mac);
        if ((deviceType == this.DeviceType.Gateway || deviceType == this.DeviceType.ChildGateway) && item == undefined) {
            item = new MotionDevice(mac, deviceType, new MotionGateway(this, mac));
            this.devices.set(mac, item);
        }
        if (item != undefined) {
            return item.gateway;
        }
        return undefined;
    }
    registerDeviceType(msg) {
        if (msg.mac != undefined && msg.data != undefined && msg.data.type != undefined) {
            let item = this.devices.get(msg.mac);
            if (item != undefined && item.id.type != msg.data.type) {
                this.log('Registered type ' + msg.data.type + ' for ' + msg.mac);
                item.id.type = msg.data.type;
                if (msg.data.wirelessMode != undefined)
                    item.id.wirelessMode = msg.data.wirelessMode;
            }
        }
    }
    registerDevice(mac) {
        let item = this.devices.get(mac);
        if (item) {
            this.log("Registered " + mac);
            item.id.registered = true;
            return true;
        }
        else {
            this.error("Tried to register unknown device " + mac);
        }
        return false;
    }
    unregisterDevice(mac) {
        const item = this.devices.get(mac);
        if (item) {
            this.log("Unregistered " + mac);
            item.id.registered = false;
            return true;
        }
        return false;
    }
    setDeviceInGroup(mac, group = true) {
        let item = this.devices.get(mac);
        if (item != undefined && (item.id.inGroup == true) != group) {
            this.log((mac + (group ? ' put in group' : ' removed from group')));
            item.id.inGroup = group;
            return true;
        }
        return false;
    }
    isRegisteredDevice(mac) {
        let item = this.devices.get(mac);
        if (item != undefined) {
            return item.id.registered;
        }
        return false;
    }
    getDevices(type = undefined, filter = undefined) {
        let devices = [];
        for (let entry of this.devices.values()) {
            // We don't care about gateways here.
            if (entry.id.deviceType === this.DeviceType.Gateway || entry.id.deviceType === this.DeviceType.ChildGateway) {
                continue;
            }
            if (type) {
                const typeMatches = Array.isArray(type) ? type.includes(entry.id.deviceType) : type == entry.id.deviceType;
                if (!typeMatches) {
                    continue;
                }
            }
            if (filter) {
                if (!filter(entry.id)) {
                    continue;
                }
            }
            devices.push(entry.id);
        }
        return devices;
    }
    onListening() {
        if (!this.client) {
            this.error('UDP client is not set');
            return;
        }
        let address = this.client.address();
        this.log('Listening using ' + address.family + ' on ' + address.address + ":" + address.port + ' ' + (this.key == null ? ' without' : 'with') + ' key');
        this.client.setBroadcast(true);
        this.client.setMulticastTTL(128);
        try { // log ENODEV error (seen it happen once) and other. Can do without multicast in a lot of cases, so log and continue
            this.client.addMembership(MULTICAST_ADDRESS);
        }
        catch (error) {
            this.error(error);
        }
        this.listening = true;
        this.emit('listening');
        this.send({ "msgType": "GetDeviceList", "msgID": this.getMessageID() });
    }
    onError(error) {
        this.error(error);
        this.emit('onError', error);
    }
    onReady(mac) {
        this.emit('ready', mac);
    }
    onNotReady(mac) {
        this.emit('notReady', mac);
    }
    onMessage(msg, info) {
        try {
            let message = JSON.parse(msg.toString());
            if (message == null) {
                this.error("Received message that parsed to nothing:");
                this.error(msg);
            }
            else {
                if (this.logHeartbeat || message.msgType != 'Heartbeat') {
                    this.log('Received ' + message.msgType + ' from ' + info.address + ' for ' + message.mac + '-' + message.deviceType);
                    if (this.verbose) {
                        this.log(message);
                    }
                }
                if (message.actionResult != undefined && !this.verbose) {
                    this.log(message.actionResult);
                }
                let gateway = this.getGateway(message.mac, message.deviceType);
                if (gateway === undefined) {
                    this.error('Gateway not found for ' + message.mac + '-' + message.deviceType);
                    return;
                }
                gateway.setToken(message.token);
                this.getGatewayAddress(message, info, gateway);
                this.checkMessageID(message);
                if (message.msgType == 'Heartbeat') {
                    this.onHeartbeat(message, info, gateway);
                }
                else if (message.msgType == 'GetDeviceListAck') {
                    this.onGetDeviceListAck(message, info, gateway);
                }
                this.registerDeviceType(message);
                this.emit(message.msgType, message, info);
                if (message.actionResult != undefined && message.msgType == 'WriteDeviceAck' && (message.data == undefined)) {
                    // write failed
                    this.readDevice(message.mac, message.deviceType);
                }
            }
        }
        catch (error) {
            this.error(error);
        }
    }
    getGatewayAddress(message, info, gateway) {
        if (!this.multicast && message.mac != undefined && info != null && info.address != undefined && info.address != '0.0.0.0' && info.address != MULTICAST_ADDRESS) {
            if (gateway != undefined && gateway.setGatewayAddress(info.address)) {
                this.log('Gateway adress for mac ' + message.mac + ' set to ' + info.address);
            }
        }
    }
    onClose() {
        this.listening = false;
        this.emit('close');
    }
    onGetDeviceListAck(message, info, gateway) {
        let added = false;
        if (message.data != undefined) {
            // The first is the gateway itself, so count one less.
            // Remember, so on heartbeat we can see devices added
            gateway.nrDevices = message.data.length - 1;
            if (this.getMaxListeners() < gateway.nrDevices) {
                this.setMaxListeners(gateway.nrDevices);
            }
            for (let device of message.data)
                if (this.devices.get(device.mac) == undefined) {
                    this.devices.set(device.mac, new MotionDevice(device.mac, device.deviceType, gateway));
                    added = true;
                    this.emit('newDevice', device.mac);
                }
        }
        if (added) {
            this.emit('newDevices');
        }
    }
    onHeartbeat(message, info, gateway) {
        // If the device counts changed, get a new list
        if (message.data != undefined && gateway.nrDevices != message.data.numberOfDevices) {
            this.log('Heartbeat found ' + (message.data.numberOfDevices - gateway.nrDevices) + ' new devices');
            if (this.verbose && !this.logHeartbeat) {
                this.log(message);
            } // do log heartbeat if device count unexpected
            this.send({ "msgType": "GetDeviceList", "msgID": this.getMessageID() }, info == null ? null : info.address);
        }
    }
    connect() {
        if (this.multisocket) {
            this.server = dgram_1.default.createSocket({ type: 'udp4', reuseAddr: true });
            // Should be unnecessary, but otherwise TS doesn't realize the server is not null.
            if (this.server == null) {
                return;
            }
            this.server.on('error', error => this.onError(error));
            this.server.on('message', (message, info) => this.onMessage(message, info));
            this.server.on('close', () => this.onClose());
        }
        this.client = dgram_1.default.createSocket({ type: 'udp4', reuseAddr: true });
        // Should be unnecessary, but otherwise TS doesn't realize the client is not null.
        if (this.client == null) {
            return;
        }
        this.client.on('listening', () => this.onListening());
        this.client.on('error', error => this.onError(error));
        this.client.on('message', (message, info) => this.onMessage(message, info));
        this.client.on('close', () => this.onClose());
        this.client.bind(UDP_PORT_RECEIVE, this.multisocket ? MULTICAST_ADDRESS : undefined, () => this.emit('connect'));
    }
    async disconnect() {
        if (this.server != null) {
            this.server.close(() => {
                this.server = null;
                this.emit('disconnect');
            });
        }
        if (this.client != null) {
            this.client.close(() => {
                this.client = null;
                this.emit('disconnect');
            });
        }
    }
    /**
     * Returns true if device write/status commands can be sent. It is required to set the appKey in advance.
     * Also, the token must be received from the gateway. Untill then only devicelist and heartbeat are possible.
     * @returns boolean if accesstoken is ready
     */
    isReady(mac) {
        let gateway = this.getGateway(mac, this.DeviceType.Gateway);
        return gateway != undefined && gateway.isReady();
    }
    /**
     * Poll all states of all devices. Subsequent calls within the minute will be postponed until the minute is over.
     * if the wirelessMode of the device is known to be bidirectional then ReadDevice is used,
     * otherwise WriteDevice with operation StatusQuery is called instead.
     * @param registered: if true only devices that registered themselves are polled, otherwise all.
     * if false, only unregistered devices are polled. if undefined, all devices are polled.
     * @param groupOnly: only poll those that are set to be part of a group
     */
    async pollStates(registered = true, groupOnly = false, forceWrite = false) {
        this.log('pollStates ' + (registered == undefined ? 'all' : (registered ? 'registered' : 'unregistered'))
            + (groupOnly ? ' groupOnly' : '') + (forceWrite ? ' forceWrite' : ''));
        if (this.pollTimer == undefined) {
            this.pollTimer = this.getPollTimer(registered, groupOnly);
            this.pollAgain = false;
            let pollcount = 0;
            for (let entry of this.devices.values())
                if (entry.id.deviceType != this.DeviceType.Gateway && entry.id.deviceType != this.DeviceType.ChildGateway &&
                    (registered == undefined || entry.id.registered == registered) &&
                    (!groupOnly || entry.id.inGroup == true)) {
                    ++pollcount;
                    if (forceWrite || entry.id.wirelessMode != this.WirelessMode.BiDirection &&
                        entry.id.wirelessMode != this.WirelessMode.BidirectionMech)
                        this.writeStatusRequest(entry.id.mac, entry.id.deviceType);
                    else
                        this.readDevice(entry.id.mac, entry.id.deviceType);
                }
            this.log('polled ' + pollcount + ' devices');
        }
        else {
            this.pollAgain = true;
            this.log('Nested poll postponed');
        }
    }
    getPollTimer(registered, groupOnly) {
        return setTimeout(() => {
            this.log('PollTimer ends, pollAgain = ' + this.pollAgain);
            this.pollTimer = null;
            if (this.pollAgain) {
                this.pollAgain = false;
                this.pollStates(registered, groupOnly);
            }
        }, 60000);
    }
    async writeStatusRequest(mac, deviceType) {
        let data;
        if (deviceType == this.DeviceType.TopDownBottomUp) {
            data = {
                "operation_T": this.Operation.StatusQuery,
                "operation_B": this.Operation.StatusQuery
            };
        }
        else {
            data = {
                "operation": this.Operation.StatusQuery
            };
        }
        await this.send({
            "msgType": 'WriteDevice',
            "mac": mac,
            "deviceType": deviceType,
            "accessToken": this.getAccessToken(mac, deviceType),
            "msgID": this.getMessageID(),
            "data": data
        });
    }
    async readDevice(mac, deviceType) {
        await this.send({
            "msgType": 'ReadDevice',
            "mac": mac,
            "deviceType": deviceType,
            "accessToken": this.getAccessToken(mac, deviceType),
            "msgID": this.getMessageID()
        });
    }
    async send(msg, addr = null) {
        let message = JSON.stringify(msg);
        let gateway = this.getGateway(msg.mac, msg.deviceType);
        if ((addr == null) && !this.multicast) {
            addr = this.ip;
        }
        if (addr == null || addr == '') {
            addr = this.multicast || gateway == undefined || gateway.gatewayAddress == null || gateway.gatewayAddress == null
                ? MULTICAST_ADDRESS : gateway.gatewayAddress;
        }
        this.log('Sending ' + msg.msgType + ' to ' + addr + ' for ' + msg.mac + '-' + msg.deviceType);
        if (this.verbose) {
            this.log(msg);
        }
        let dgram = this.server == null || addr == MULTICAST_ADDRESS ? this.client : this.server;
        if (dgram == null) {
            this.error('UDP client is not set');
            return;
        }
        dgram.send(message, UDP_PORT_SEND, addr, (error, bytes) => {
            if (error) {
                this.error(error);
                this.emit('sendError', error);
            }
        });
        this.emit(msg.msgType, msg);
    }
}
exports.MotionDriver = MotionDriver;
