const Logger = require('../logger/logger');

module.exports = class DefaultHandler {
  /** @type {string | null} */
  type = null;
  /** @type {DefaultHandler | null} */
  nextHandler = null;
  logger = new Logger();
  /**
   * @param {import('../model/connection-message/connection-message-model').ConnectionMessage} connectionMessage
   * @returns {import('./auth/auth-controller').AuthPayload | null}
   */
  handle(connectionMessage) {
    if (this.type !== connectionMessage.type && this.nextHandler) {
      return this.nextHandler.handle(connectionMessage);
    }
    return null;
  }
  /**
   * @param {DefaultHandler} nextHandler
   */
  setNextHandler(nextHandler) {
    this.nextHandler = nextHandler;
    return this.nextHandler;
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
