// const Logger = require('../logger/logger');
const ConnectionMessageModel = require('../model/connection-message/connection-message-model');
const { SERVER_HANDLER_INVALID, REQUEST_INVALID, USER_NOT_AUTH } = require('./default-messages');

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
  /** @type {import('../model/user/user-model') | null} */
  currentUser = null;
  isOnlyAuthAccess = true;

  /**
   * @param {import('../model/user/user-model')} currentUser
   */
  constructor(currentUser = null) {
    this.currentUser = currentUser;
  }
  /**
   * @param {import('../model/connection-message/connection-message-model').ConnectionMessage} connectionMessage
   * @returns {DefaultPayload}
   */
  run(connectionMessage) {
    if (!ConnectionMessageModel.isCorrectMessage(connectionMessage)) {
      return this.getErrorAnswer(REQUEST_INVALID);
    }
    if (this.isOnlyAuthAccess) {
      if (this.currentUser === null || !this.currentUser.isLogined) {
        return this.getErrorAnswer(USER_NOT_AUTH);
      }
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
