"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function inParallel(entries, fn) {
    const results = await Promise.all(entries.map(fn));
    return results.filter(r => r !== null);
}
exports.default = inParallel;
