"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const homey_rfdriver_1 = require("homey-rfdriver");
const Constants = {
    PulseRepetitions: 45
};
class MLE25Device extends homey_rfdriver_1.RFDevice {
    async onRFInit() {
        await super.onRFInit();
        this.registerCapabilityListener('windowcoverings_state', async (value) => {
            await this.setMotorState(value);
        });
        this.registerCapabilityListener('windowcoverings_tilt_up', async () => {
            if (this.getSetting('invert_tilt')) {
                await this.setTiltState(1 /* TiltDirection.Down */);
            }
            else {
                await this.setTiltState(0 /* TiltDirection.Up */);
            }
        });
        this.registerCapabilityListener('windowcoverings_tilt_down', async () => {
            if (this.getSetting('invert_tilt')) {
                await this.setTiltState(0 /* TiltDirection.Up */);
            }
            else {
                await this.setTiltState(1 /* TiltDirection.Down */);
            }
        });
    }
    async setMotorState(value) {
        const data = this.getData();
        let props = { device: this };
        if (value !== 'idle' && this.getSetting('rotated') === '180') {
            value = value === 'up' ? 'down' : 'up';
        }
        if (value !== 'idle' && this.getSetting('pulse_mode')) {
            props['repetitions'] = Constants.PulseRepetitions;
        }
        this.log(`Setting motor state to ${value} (${data.address}:${data.channel})`);
        await this.driver.tx({
            // Up/down/idle
            cmd: value,
            address: data.address,
            channel: data.channel,
        }, props);
    }
    async setTiltState(direction) {
        const data = this.getData();
        const value = direction ? 'up' : 'down';
        this.log(`Setting motor state to ${value} (${data.address}:${data.channel})`);
        await this.driver.tx({
            // Up/down
            cmd: value,
            address: data.address,
            channel: data.channel,
        }, { device: this });
    }
    async goToPreferredPosition() {
        for (let i = 0; i < 6; i++) {
            await this.setMotorState('idle');
        }
    }
}
exports.default = MLE25Device;
MLE25Device.RX_ENABLED = true;
module.exports = MLE25Device;
