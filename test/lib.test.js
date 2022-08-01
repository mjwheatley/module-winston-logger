const expect = require(`chai`).expect;
const redact = require(`./modules/module-winston-logger/src/lib/utils`).redact;
const config = require(`./Config`);

describe(`lib unit tests`, () => {
   describe(`redact object unit tests`, () => {
      const info = {
         Digit: `RedactOnlyForPIN`,
         CallSid: `1a2b3c`,
         ADDRESS1: `123 Sesame St.`
      };

      it(`should redact object`, () => {
         expect(redact({
            info,
            flow: `SRS`,
            state: `PINValidation`,
            needsRedacting: config.logger.redact
         })[`Digit`]).to.be.equal(`***`);
         expect(redact({
            info,
            flow: `SRS`,
            state: `PINValidation`,
            needsRedacting: config.logger.redact
         })[`CallSid`]).to.be.equal(`1a2b3c`);
      });

      it(`should redact based on flow and state config`, () => {
         expect(redact({
            info,
            flow: `InitialFlow`,
            state: `StartIVR`,
            needsRedacting: config.logger.redact
         })[`Digit`]).to.be.equal(`RedactOnlyForPIN`);
         expect(redact({
            info,
            flow: `InitialFlow`,
            state: `StartIVR`,
            needsRedacting: config.logger.redact
         })[`CallSid`]).to.be.equal(`1a2b3c`);
      });

      it(`should be able to handle strings or objects`, () => {
         const stringInfo = JSON.stringify(info);
         expect(redact({
            info: stringInfo,
            flow: `SRS`,
            state: `PINValidation`,
            needsRedacting: config.logger.redact
         })[`Digit`]).to.be.equal(`***`);
         expect(redact({
            info: stringInfo,
            flow: `SRS`,
            state: `PINValidation`,
            needsRedacting: config.logger.redact
         })[`CallSid`]).to.be.equal(`1a2b3c`);
      });

      it(`should handle Errors`, () => {
         const error = new Error(`Test Error`);
         expect(redact({
            info: error,
            flow: `InitialFlow`,
            state: `StartIVR`,
            needsRedacting: config.logger.redact
         })[`message`]).to.be.equal(`***`);
         expect(redact({
            info: error,
            flow: `SRS`,
            state: `PINValidation`,
            needsRedacting: config.logger.redact
         })[`message`]).to.be.equal(`Test Error`);
      });

      it(`should handle return unmodified string if string passed is not JSON`, () => {
         const info = `Not JSON`;
         expect(redact({
            info,
            flow: `InitialFlow`,
            state: `StartIVR`,
            needsRedacting: config.logger.redact
         })).to.be.equal(`Not JSON`);
      });

      it(`should redact nested objects`, () => {
         info.nested = {};
         info.nested.Digit = `NestedRedact`;
         expect(redact({
            info,
            flow: `SRS`,
            state: `PINValidation`,
            needsRedacting: config.logger.redact
         })[`Digit`]).to.be.equal(`***`);
         expect(redact({
            info,
            flow: `SRS`,
            state: `PINValidation`,
            needsRedacting: config.logger.redact
         })[`CallSid`]).to.be.equal(`1a2b3c`);
         expect(redact({
            info,
            flow: `SRS`,
            state: `PINValidation`,
            needsRedacting: config.logger.redact
         })[`nested`][`Digit`]).to.be.equal(`***`);
      });

      it(`should handle empty and undefined`, () => {
         let info = ``;
         expect(redact({
            info,
            flow: `InitialFlow`,
            state: `StartIVR`,
            needsRedacting: config.logger.redact
         })).to.be.equal(``);
         info = undefined;
         expect(redact({
            info,
            flow: `InitialFlow`,
            state: `StartIVR`,
            needsRedacting: config.logger.redact
         })).to.be.undefined;
      });

      it(`should return passed info if no flow or state passed`, () => {
         expect(redact({ info, flow: ``, state: undefined })).to.be.equal(info);
      });

      it(`should redact a field globally`, () => {
         expect(redact({
            info,
            flow: `SRS`,
            state: `PINValidation`,
            needsRedacting: {
               "global": {
                  "ADDRESS1": `redact`,
                  "POSTAL_CODE": `redact`,
                  "FirstName": `redact`,
                  "LastName": `redact`,
                  "BusinessName": `redact`,
                  "StreetNo": `redact`
               }
            }
         })[`ADDRESS1`]).to.be.equal(`***`);
         expect(redact({
            info,
            flow: `SRS`,
            state: `PINValidation`,
            needsRedacting: config.logger.redact
         })[`CallSid`]).to.be.equal(`1a2b3c`);
      });
   });
});
