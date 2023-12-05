"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CapabilitiesFactory {
    static getCapabilitiesForDevice(device) {
        if (this.BiDirectionalModes.indexOf(device.wirelessMode) === -1) {
            // Uni-directional
            return ["windowcoverings_state" /* Capability.State */];
        }
        // Bi-directional
        switch (device.motorType) {
            case 9 /* MotorType.TDBU */:
                return [
                    "brel_top_position" /* Capability.Top */,
                    "brel_bottom_position" /* Capability.Bottom */
                ];
            case 22 /* MotorType.Shutter */:
                return ["windowcoverings_tilt_set" /* Capability.Tilt */];
            case 2 /* MotorType["Venetian Blinds"] */:
            case 6 /* MotorType["Roller Shutter"] */:
                return [
                    "windowcoverings_set" /* Capability.Set */,
                    "windowcoverings_tilt_set" /* Capability.Tilt */
                ];
            default:
                return ["windowcoverings_set" /* Capability.Set */];
        }
    }
}
exports.default = CapabilitiesFactory;
CapabilitiesFactory.BiDirectionalModes = [
    1 /* WirelessMode.BiDirection */,
    2 /* WirelessMode.BiDirectionMechanicalLimits */
];
