/* eslint-disable no-invalid-this */
import traverse from 'traverse';

/**
 * @param {Object} {
 *     info: logged message
 *     flow: logger's flow
 *     state: logger's nextstate
 *     needsRedacting: Configured object used to determine if redaction should happen
 *     -- flow and state are used to see if exists in object
 *     -- if flow + state exist in needsRedacting then redact
 *     -- 'global' is also used to traverse info object and if key is matched in info it is redacted
 * }
 * @return {String} info
 * **/
export const redact = ({
                         info,
                         flow,
                         state,
                         needsRedacting
                       }: { info: any, flow: any, state: any, needsRedacting: any }) => {
  needsRedacting = needsRedacting || {};
  if (!needsRedacting.global && (!needsRedacting[flow] || (needsRedacting[flow] && !needsRedacting[flow][state]))) {
    return info;
  }

  if (typeof info == `string`) {
    try {
      info = JSON.parse(info);
    } catch (err) {
      return info;
    }
  }

  if (typeof info == `object`) {
    return deepRedact({ info, flow, state, needsRedacting });
  }

  return info;
};

/**
 * This method is to allow for recursive calling to check for stringified values
 * @param {Object} {
 *     info: logged message
 *     flow: logger's flow
 *     state: logger's nextstate
 *     needsRedacting: Configured object used to determine if redaction should happen
 *     -- flow and state are used to see if exists in object
 *     -- if flow + state exist in needsRedacting then redact
 *     -- 'global' is also used to traverse info object and if key is matched in info it is redacted
 * }
 * @return {String} info
 * **/
const deepRedact = ({
                      info,
                      flow,
                      state,
                      needsRedacting
                    }: { info: any, flow: any, state: any, needsRedacting: any }) => {
  return traverse(info).map(function (val) {
    let isRedacted = false;
    const parsed = parseIfJSONString(val);
    if (parsed) {
      this.update(JSON.stringify(deepRedact({
        info: parsed,
        flow,
        state,
        needsRedacting
      })));
    } else {
      if (needsRedacting[flow] && needsRedacting[flow][state]) {
        // @ts-ignore
        if (needsRedacting[flow][state][this.key]) {
          isRedacted = true;
        }
      }
      // @ts-ignore
      if (needsRedacting.global && needsRedacting.global[this.key]) {
        isRedacted = true;
      }
      if (isRedacted) {
        this.update(`***`);
      }
    }
  });
};

/**
 * Check String to see if JSON
 * @param {String} jsonString
 * @return {Object} o
 * **/
const parseIfJSONString = (jsonString: string) => {
  try {
    const o = JSON.parse(jsonString);
    if (o && typeof o === `object`) {
      return o;
    }
  } catch (e) {

  }

  return undefined;
};
