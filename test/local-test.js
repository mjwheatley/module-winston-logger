const expect = require(`chai`).expect;
const Logger = require(`modules/module-winston-logger/src/lib/logger`);

const loggerMetaData = {
   'LambdaName': `UnitLambdaName`,
   'Asurion-CallId': `12345678910`,
   'Twilio-CallSid': `1a2b3c4d`
};

const logger = new Logger(loggerMetaData);

const privateMessage = {
   message: `this is a secret`,
   anotherMessage: JSON.stringify({ message: `this is another secret` })
};

describe(`# Logger`, () => {
   it(`should log an error object`, () => {
      const logger = new Logger({ LogLevel: `debug` });
      const error = new Error(`Test logger.error`);
      logger.error(`Logger Error`, error);
      const response = {
         ERROR: { message: error.message, stack: error.stack }
      };
      logger.error(`Wrapped error: `, response);
   });

   it(`should add metadata by object`, () => {
      const metadataToAdd = {
         'DialedNumber': `800-111-2222`,
         'Flow': `SRS`,
         'NextState': `PINValidation`
      };
      logger.addMetaDataByObject(metadataToAdd);
      const metadata = logger.getMetaData();
      expect(metadata.DialedNumber).to.exist;
      expect(metadata.Flow).to.exist;
      expect(metadata.NextState).to.exist;
   });

   it(`should not log if private`, () => {
      logger.addMetaDataByKey(`private`, true);
      logger.info(`MessageKey`, privateMessage);
   });

   it(`should print private message if private key deleted`, () => {
      logger.removeMetaDataByKey(`private`);
      logger.debug(`MessageKey`, privateMessage);
      const metadata = logger.getMetaData();
      expect(metadata.private).to.not.exist;
   });

   it(`should redact digits`, () => {
      const metadataToAdd = {
         'DialedNumber': `800-111-2222`,
         'Flow': `SRS`,
         'NextState': `PINValidation`
      };
      logger.addMetaDataByObject(metadataToAdd);
      const event = {
         queryStringParameters: {
            Digit: `1234`
         }
      };

      logger.warn(`MessageKey`, event);
   });
   it(`should redact objects`, () => {
      const metadataToAdd = {
         'DialedNumber': `800-111-2222`,
         'Flow': `SRS`,
         'NextState': `PINValidation`
      };
      logger.addMetaDataByObject(metadataToAdd);
      logger.updateConfig({
         config: {
            logger: {
               redact: {
                  global: { message: `redact`, anotherMessage: `redact` }
               }, LOG_LEVEL: `info`
            }
         }
      });
      logger.warn(`MessageKey`, privateMessage);
   });

   it(`should return metadata`, () => {
      expect(logger.getMetaData().LambdaName).to.equal(`UnitLambdaName`);
   });

   it(`should update the config`, () => {
      logger.debug(`debug`, `This is a debug message.`);
      logger.updateConfig({ config: { logger: { LOG_LEVEL: `info` } } });
      logger.debug(`debug`, `This message should not appear because the log level was updated to info.`);
   });

   it(`should set a default config if the updated config is undefined`, () => {
      logger.updateConfig({});
   });

   it(`should add a metric metadata log message then remove metadata`, () =>{
      logger.metric(`TestMetric`, 15);
      logger.info(`Test`, `Message`);
   });

   it(`should add a metric metadata log message then remove metadata`, () =>{
      logger.metric(`TestMetric`, `ab`); // log 0
      logger.info(`Test`, `Message`);
   });

   it(`should add a metric metadata log message then remove metadata and mutliply`, () =>{
      logger.metric(`TestMetric`, .015, 1000);
      logger.info(`Test`, `Message`);
   });

   it(`should add a metric metadata log message then remove metadata and mutliply`, () =>{
      logger.metric(`TestMetric`, .015, `1000`);
      logger.info(`Test`, `Message`);
   });

   it(`should add a metric metadata log message then remove metadata and mutliply`, () =>{
      logger.metric(`TestMetric`, .015, `ab`);
      logger.info(`Test`, `Message`);
   });
});

