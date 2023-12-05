"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionInformation = exports.DeviceTypeToNameMap = void 0;
const DeviceTypeToNameMap = {
    1: 'Roller Blinds',
    2: 'Venetian Blinds',
    3: 'Roman Blinds',
    4: 'Honeycomb Blinds',
    5: 'Shangri - La Blinds',
    6: 'Roller Shutter',
    7: 'Roller Gate',
    8: 'Awning',
    9: 'TDBU',
    10: 'Day & night Blinds',
    11: 'Dimming Blinds',
    12: 'Curtain',
    13: 'Curtain (Open Left)',
    14: 'Curtain (Open Right)',
    22: 'Shutter'
};
exports.DeviceTypeToNameMap = DeviceTypeToNameMap;
const ConnectionInformation = {
    Port: 32100,
    Address: '238.0.0.18'
};
exports.ConnectionInformation = ConnectionInformation;
