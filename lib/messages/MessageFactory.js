"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageFactory = void 0;
class MessageFactory {
    static createDiscoveryMessage() {
        return {
            msgID: MessageFactory.getMessageTimestamp(),
            msgType: "GetDeviceList" /* MessageTypes.GetDeviceList */
        };
    }
    static createReadDeviceMessage(apiToken, mac, deviceType) {
        return {
            msgID: MessageFactory.getMessageTimestamp(),
            msgType: "ReadDevice" /* MessageTypes.ReadDevice */,
            AccessToken: apiToken,
            deviceType: deviceType,
            mac: mac
        };
    }
    /**
     * Create a message for writing a position to a device.
     *
     * @param apiToken
     * @param mac
     * @param deviceType
     * @param targetPosition has to be in range 0.0 - 1.0
     */
    static createWriteTargetPositionMessage(apiToken, mac, deviceType, targetPosition) {
        return {
            msgID: MessageFactory.getMessageTimestamp(),
            msgType: "WriteDevice" /* MessageTypes.WriteDevice */,
            deviceType: deviceType,
            AccessToken: apiToken,
            mac: mac,
            data: {
                targetPosition: parseInt((targetPosition * 100).toFixed(0))
            }
        };
    }
    /**
     * Create a message for writing an angle to a device.
     *
     * @param apiToken
     * @param mac
     * @param deviceType
     * @param targetAngle has to be in range 0.0 - 1.0
     */
    static createWriteAngleMessage(apiToken, mac, deviceType, targetAngle) {
        return {
            msgID: MessageFactory.getMessageTimestamp(),
            msgType: "WriteDevice" /* MessageTypes.WriteDevice */,
            deviceType: deviceType,
            AccessToken: apiToken,
            mac: mac,
            data: {
                targetAngle: parseInt((targetAngle * 180).toFixed(0))
            }
        };
    }
    static createSetOperationMessage(apiToken, mac, deviceType, operation) {
        return {
            msgID: MessageFactory.getMessageTimestamp(),
            msgType: "WriteDevice" /* MessageTypes.WriteDevice */,
            deviceType: deviceType,
            AccessToken: apiToken,
            mac: mac,
            data: {
                operation: operation
            }
        };
    }
    static createWriteTopPositionMessage(apiToken, mac, deviceType, position) {
        return {
            msgID: MessageFactory.getMessageTimestamp(),
            msgType: "WriteDevice" /* MessageTypes.WriteDevice */,
            deviceType: deviceType,
            AccessToken: apiToken,
            mac: mac,
            data: {
                // Note: no multiplication by 100
                targetPosition_T: position
            }
        };
    }
    static createWriteBottomPositionMessage(apiToken, mac, deviceType, position) {
        return {
            msgID: MessageFactory.getMessageTimestamp(),
            msgType: "WriteDevice" /* MessageTypes.WriteDevice */,
            deviceType: deviceType,
            AccessToken: apiToken,
            mac: mac,
            data: {
                // Note: no multiplication by 100
                targetPosition_B: position
            }
        };
    }
    static getMessageTimestamp() {
        return new Date().getTime().toString();
    }
}
exports.MessageFactory = MessageFactory;
