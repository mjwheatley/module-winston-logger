import { createLogger, format, transports, Logger } from 'winston';
import { redact as redactUtil } from './utils';

const defaultLogLevel = `error`;
const defaultConfig = { logger: { LOG_LEVEL: defaultLogLevel } };
/** **********
 *   In winston, both Logger and Transport instances are treated as objectMode streams that accept an info object.
 The info parameter provided to a given format represents a single log message. The object itself is mutable.
 Every info must have at least the level and message properties:

 const info = {
    level: 'info',                 // Level of the logging message
    message: 'Hey! Log something?' // Descriptive message being logged.
    };
 Properties besides level and message are considered as "meta". i.e.:

 const { level, message, ...meta } = info;
 *
 * ********************* */

export default class {
  private metaData: any;
  private config: any;
  private transports: any;
  private winstonLogger: Logger;

  /**
   * @param {Object?} metaData
   * @param {Object?} config
   **/
  constructor({ metaData = {}, config }: { metaData?: any, config?: any } | undefined = {}) {
    this.metaData = metaData;
    this.config = config || JSON.parse(JSON.stringify(defaultConfig));

    const ignorePrivate = format((info, _opts) => {
      if (info.private) {
        return false;
      }
      return info;
    });

    const enumerateErrorFormat = format((info: any) => {
      if (info.message instanceof Error) {
        info.stack = info.message.stack;
        info.message = info.message.message;
      }

      return info;
    });

    const redact = format((info: any) => {
      info.message = redactUtil({
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
      } as any)
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

  /**
   * Update Config Object
   * Sets log level
   * @param {Object} {
   *   {Object} config
   * }
   */
  updateConfig({ config }: { config: any }) {
    if (!config || (config && typeof config !== `object`)) {
      config = JSON.parse(JSON.stringify(defaultConfig));
    }
    this.config = config;
    let logLevel = defaultLogLevel;
    if (config && config.logger && config.logger.LOG_LEVEL) {
      logLevel = config.logger.LOG_LEVEL;
    }
    this.transports.console.level = logLevel;
  }

  /**
   * Add metadata by object
   * @param {Object} data
   */
  addMetaDataByObject(data: any) {
    this.metaData = Object.assign(this.metaData, data);
  }

  /**
   * add metadata by key
   * @param {String} key
   * @param {String} value
   */
  addMetaDataByKey(key: string, value: string) {
    this.metaData[key] = value;
  }

  /**
   * remove metadata by key
   * @param {String} key
   */
  removeMetaDataByKey(key: string) {
    delete this.metaData[key];
  }

  /**
   * remove metadata by object
   * @param {Object} data
   */
  removeMetaDataByObject(data = {}) {
    Object.keys(data).forEach((key) => {
      delete this.metaData[key];
    });
  }

  /**
   * @return {Object} metadata
   */
  getMetaData() {
    return this.metaData;
  }

  /**
   * build metadata
   * @param {String} key
   * @return {Object} cwLogData
   */
  _buildLogMetaData(key: string) {
    // sequencing the log data to display appropriately in CloudWatch
    let cwLogData = {
      Timestamp: new Date(),
      messageKey: key
    };
    cwLogData = Object.assign(cwLogData, this.metaData);
    return cwLogData;
  }

  /**
   * Wrap all winston log levels
   * from most important to least important
   * const levels = {
   *    error: 0,
   *    warn: 1,
   *    info: 2,
   *    http: 3,
   *    verbose: 4,
   *    debug: 5,
   *    silly: 6
   *  };
   * **/

  /**
   * silly level log 6
   * @param {String} msgKey
   * @param {String} message
   */
  silly(msgKey: string, message: any) {
    this.winstonLogger.silly(message, this._buildLogMetaData(msgKey));
  }

  /**
   * debug level log 5
   * @param {String} msgKey
   * @param {String} message
   */
  debug(msgKey: string, message: any) {
    this.winstonLogger.debug(message, this._buildLogMetaData(msgKey));
  }

  /**
   * verbose level log 4
   * @param {String} msgKey
   * @param {String} message
   */
  verbose(msgKey: string, message: any) {
    this.winstonLogger.verbose(message, this._buildLogMetaData(msgKey));
  }

  /**
   * http level log 3
   * @param {String} msgKey
   * @param {String} message
   */
  http(msgKey: string, message: any) {
    this.winstonLogger.http(message, this._buildLogMetaData(msgKey));
  }

  /**
   * info level log 2
   * @param {String} msgKey
   * @param {String} message
   */
  info(msgKey: string, message: any) {
    this.winstonLogger.info(message, this._buildLogMetaData(msgKey));
  }

  /**
   * warn level log 1
   * @param {String} msgKey
   * @param {String} message
   */
  warn(msgKey: string, message: any) {
    this.winstonLogger.warn(message, this._buildLogMetaData(msgKey));
  }

  /**
   * error level log 0
   * @param {String} msgKey
   * @param {String} message
   */
  error(msgKey: string, message: any) {
    this.winstonLogger.error(message, this._buildLogMetaData(msgKey));
  }

  /**
   * Custom metric logger
   * forces metrics to numbers
   * Multiplier optional parameter that can be added to make kibana graphing work
   * @param {String} msgKey
   * @param {Number} metric
   * @param {Number} multiplier
   */
  metric(msgKey: string, metric: number, multiplier: number) {
    let metricToLog = metric;
    if (isNaN(metric)) {
      metricToLog = 0;
    }
    if (multiplier && !isNaN(multiplier)) {
      metricToLog = metric * multiplier;
    }
    this.addMetaDataByKey(`metric`, `${metricToLog}`);
    this.winstonLogger.info(`${metric}`, this._buildLogMetaData(msgKey));
    this.removeMetaDataByKey(`metric`);
  }
};
