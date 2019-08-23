const expect = require('chai').expect;
const Logger = require('../logger');

let loggerMetaData = {
    'LambdaName': "UnitLambdaName",
    'Asurion-CallId': "12345678910",
    'Twilio-CallSid': "1a2b3c4d"
};

const logger = new Logger(loggerMetaData);

let privateMessage = {
    message: "this is a secret"
};

describe('# Logger', () => {
    it("should log an error object", () => {
        let logger = new Logger({ LogLevel: "debug" });
        let error = new Error("Test logger.error");
        logger.error("Logger Error", error);
        let response = {
            ERROR: { message: error.message, stack: error.stack }
        };
        logger.error("Wrapped error: ", response);
    });

    it("should add metadata by object", () => {
        let metadataToAdd = {
            'DialedNumber': "800-111-2222",
            'Flow': "SRS",
            'NextState': "PINValidation"
        };
        logger.addMetaDataByObject(metadataToAdd);
        let metadata = logger.getMetaData();
        expect(metadata.DialedNumber).to.exist;
        expect(metadata.Flow).to.exist;
        expect(metadata.NextState).to.exist;
    });

    it("should not log if private", () => {
        logger.addMetaDataByKey('private', true);
        logger.info("MessageKey", privateMessage);
    });

    it("should print private message if private key deleted", () => {
        logger.removeMetaDataByKey('private');
        logger.debug("MessageKey", privateMessage);
        let metadata = logger.getMetaData();
        expect(metadata.private).to.not.exist;
    });

    it("should redact digits", () => {
        let metadataToAdd = {
            'DialedNumber': "800-111-2222",
            'Flow': "SRS",
            'NextState': "PINValidation"
        };
        logger.addMetaDataByObject(metadataToAdd);
        let event = {
            queryStringParameters: {
                Digit: '1234'
            }
        };

        logger.warn("MessageKey", event);
    });

    it("should return metadata", () => {
        expect(logger.getMetaData().LambdaName).to.equal("UnitLambdaName");
    });

    it("should update the config", () => {
        logger.debug("debug", "This is a debug message.");
        logger.updateConfig({config: {logger:{LOG_LEVEL: "info"}}});
        logger.debug("debug", "This message should not appear because the log level was updated to info.");
    });

    it("should set a default config if the updated config is undefined", () => {
        logger.updateConfig({});
    });
});