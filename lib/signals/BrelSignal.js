"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const homey_rfdriver_1 = require("homey-rfdriver");
class BrelSignal extends homey_rfdriver_1.RFSignal {
    static commandToPayload(data) {
        if (!data) {
            return null;
        }
        let command;
        if (data.windowcoverings_tilt_up || data.windowcoverings_tilt_down) {
            command = this.CommandMap.get(data.windowcoverings_tilt_up ? 'up' : 'down');
        }
        else {
            command = this.CommandMap.get(data.cmd || data.windowcoverings_state);
        }
        if (command) {
            const address = homey_rfdriver_1.RFUtil.bitStringToBitArray(data.address);
            const channel = homey_rfdriver_1.RFUtil.bitStringToBitArray(data.channel);
            return address.concat(channel, command.split('').map(Number));
        }
        return null;
    }
    static payloadToCommand(payload) {
        // Check if the bitString of bit 32-39 exists in the stateMap
        const stateKey = homey_rfdriver_1.RFUtil.bitArrayToString(payload.slice(32, 39));
        if (!this.StateMap.has(stateKey)) {
            return null;
        }
        const data = {
            address: homey_rfdriver_1.RFUtil.bitArrayToString(payload.slice(0, 24)),
            channel: homey_rfdriver_1.RFUtil.bitArrayToString(payload.slice(24, 32)),
            group: payload.slice(24, 32).indexOf(1) === -1,
            cmd: this.StateMap.get(homey_rfdriver_1.RFUtil.bitArrayToString(payload.slice(32, 39))),
        };
        // If the command corresponds to a windowcoverings_state capability value set the value to data.windowcoverings_state
        // RFDriver will automatically call this.setCapabilityValue('windowcoverings_state', data.windowcoverings_state);
        if (data.cmd === 'idle') {
            data.windowcoverings_state = data.cmd;
        }
        // Initially we assume the up/down command is tilt since it triggers going up/down after holding it 2 seconds
        if (data.cmd === 'up' || data.cmd === 'down') {
            data[`windowcoverings_tilt_${data.cmd}`] = true;
            data.tilt = data.cmd;
        }
        // Set data.id to a unique value for this device. Since a remote has an address and 5 channels and each
        // channel can contain a different blind
        data.id = `${data.address}:${data.channel}`;
        return data;
    }
    static commandToDeviceData(command) {
        return {
            // Prevent homey-rfid from generating a unique identifier,
            // since the id we have is already unique and this prevents duplicates.
            uuid: undefined,
            address: command.address,
            channel: command.channel,
            id: command.id
        };
    }
    static createPairCommand() {
        const data = {
            address: homey_rfdriver_1.RFUtil.generateRandomBitString(24),
            channel: `0000${homey_rfdriver_1.RFUtil.generateRandomBitString(4)}`,
            group: false,
            cmd: 'idle',
        };
        data.channel = data.channel === '00000000' ? '00000001' : data.channel;
        data.id = `${data.address}:${data.channel}`;
        return data;
    }
    static numberToCommandString(input) {
        return input.toString(2).padStart(8, '0');
    }
}
exports.default = BrelSignal;
_a = BrelSignal;
BrelSignal.ID = "brel";
BrelSignal.FREQUENCY = "433";
// The commands mapped to the corresponding bitString.
BrelSignal.CommandMap = new Map([
    ['up', _a.numberToCommandString(0x11)],
    ['my', _a.numberToCommandString(0x55)],
    ['idle', _a.numberToCommandString(0x55)],
    ['down', _a.numberToCommandString(0x33)],
    ['deep_up', _a.numberToCommandString(0x1E)],
    ['deep_down', _a.numberToCommandString(0x3C)],
    ['p2', _a.numberToCommandString(0xCC)],
]);
// The bitStrings mapped to the corresponding command/
BrelSignal.StateMap = new Map(
// Remove the last bit of the command since Homey core does not receive this bit correctly.
// Doesn't affect performance
Array.from(_a.CommandMap.entries()).map(entry => {
    entry[1] = entry[1].substring(0, 7);
    return entry.reverse();
}));
