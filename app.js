"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const homey_1 = __importDefault(require("homey"));
const Logger_1 = __importDefault(require("./lib/Logger"));
class BrelHomeApp extends homey_1.default.App {
    /**
     * onInit is called when the app is initialized.
     */
    async onInit() {
        Logger_1.default.setLogger(this);
        this.log('Brel has been initialized');
    }
}
module.exports = BrelHomeApp;
