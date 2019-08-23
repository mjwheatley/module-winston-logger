const { createLogger, format, transports } = require('winston');
const utils = require('./lib/utils');
/************
 *   In winston, both Logger and Transport instances are treated as objectMode streams that accept an info object.
 The info parameter provided to a given format represents a single log message. The object itself is mutable. Every info must have at least the level and message properties:

 const info = {
    level: 'info',                 // Level of the logging message  
    message: 'Hey! Log something?' // Descriptive message being logged.
    };
 Properties besides level and message are considered as "meta". i.e.:

 const { level, message, ...meta } = info;
 *
 * ********************* */

module.exports = class {
    constructor(params) {
        this.metaData = params;
        this.config = {logger:{LOG_LEVEL: "debug"}};
        /**
         * { 'CallId': callId, 'LambdaName': name, 'ClientId': clientId, 'DialedNumber': dialedNumber, 'ANI' : callerId, 'MDN' : phoneNumber }
         */

        const ignorePrivate = format((info, opts) => {
            if (info.private) {
                return false;
            }
            return info;
        });

        const enumerateErrorFormat = format(info => {
            if (info.message instanceof Error) {
                info.stack = info.message.stack;
                info.message = info.message.message;
            }

            return info;
        });

        const redact = format(info => {
            info.message = utils.redact({
                info: info.message,
                flow: this.metaData.Flow,
                state: this.metaData.NextState,
                needsRedacting: this.config.logger.redact
            });
            return info;
        });

        this.transports = {
            console: new transports.Console({
                handleExceptions: false,
                raw: true,
                colorize: false, // Do not colorise in Lambda environment, as it just screws up the output
                level: this.config.logger.LOG_LEVEL,
                timestamp: true
            })
        };

        this.winstonLogger = createLogger({
            format: format.combine(
                ignorePrivate(),
                enumerateErrorFormat(),
                redact(),
                format.json()
            ),
            transports: [this.transports.console]
        });
    }

    updateConfig({config}) {
        if (!config || (config && typeof config !== "object")) {
            config = {};
        }
        this.config = config;
        let logLevel = "debug";
        if (config && config.logger && config.logger.LOG_LEVEL) {
            logLevel = config.logger.LOG_LEVEL
        }
        this.transports.console.level = logLevel;
    }

    addMetaDataByObject(data) {
        this.metaData = Object.assign(this.metaData, data);
    }

    addMetaDataByKey(key, value) {
        this.metaData[key] = value;
    }

    removeMetaDataByKey(key) {
        delete this.metaData[key];
    }

    getMetaData() {
        return this.metaData;
    }

    _buildLogMetaData(key) {
        //sequencing the log data to display appropriately in CloudWatch
        let cwLogData = {
            Timestamp: new Date(),
            messageKey: key
        };
        cwLogData = Object.assign(cwLogData, this.metaData);
        return cwLogData;
    }

    //winstonlogger methods uses
    debug(msgKey, message) {
        this.winstonLogger.debug(message, this._buildLogMetaData(msgKey));
    }

    warn(msgKey, message) {
        this.winstonLogger.warn(message, this._buildLogMetaData(msgKey));
    }

    info(msgKey, message) {
        this.winstonLogger.info(message, this._buildLogMetaData(msgKey));
    }

    error(msgKey, message) {
        this.winstonLogger.error(message, this._buildLogMetaData(msgKey));
    }
};
