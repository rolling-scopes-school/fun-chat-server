// const Logger = require('../logger/logger');
const ConnectionMessageModel = require('../model/connection-message/connection-message-model');
const { SERVER_HANDLER_INVALID, REQUEST_INVALID } = require('./default-messages');

/**
 * @exports
 * @typedef {{
 * status: boolean,
 * message: string[]
 * }} DefaultPayload
 */

module.exports = class DefaultController {
  /** @type {import('./default-handler') | null} */
  handler = null;

  /**
   * @param {import('../model/connection-message/connection-message-model').ConnectionMessage} connectionMessage
   * @returns {DefaultPayload}
   */
  run(connectionMessage) {
    if (!ConnectionMessageModel.isCorrectMessage(connectionMessage)) {
      return this.getErrorAnswer(REQUEST_INVALID);
    }
    const connectionMessageModel = new ConnectionMessageModel(connectionMessage);
    if (this.handler) {
      return this.handler.handle(connectionMessageModel);
    }
    return this.getErrorAnswer(SERVER_HANDLER_INVALID);
  }
  /**
   * @param {string} message
   * @returns {import('../model/connection-message/connection-message-model').ConnectionMessagePayload}
   */
  getErrorAnswer(message) {
    return {
      error: message,
    };
  }
};
