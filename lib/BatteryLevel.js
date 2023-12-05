"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getBatteryLevelAsPercentage(voltage) {
    // 12v motor: 10.4v empty, 12.4v full
    // 8.4v motor: 7.2v empty, 8.7v full
    // If the voltage is below 10v, we assume it's a 8.4v motor.
    let percentage;
    if (voltage < 10) {
        percentage = 100 / (8.7 - 7.2) * (voltage - 7.2);
    }
    else {
        percentage = 100 / (12.4 - 10.4) * (voltage - 10.4);
    }
    return Math.round(percentage);
}
exports.default = getBatteryLevelAsPercentage;
