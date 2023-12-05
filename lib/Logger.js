"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Logger {
    log(...args) {
        this._impl.log(...args);
    }
    error(...args) {
        this._impl.error(...args);
    }
    setLogger(impl) {
        this._impl = impl;
    }
}
exports.default = new Logger();
