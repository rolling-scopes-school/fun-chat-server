const ConnectionPool = require('../../../pool/connection-pool');
const DefaultHandler = require('../../default-handler');
const { TYPE_INVALID } = require('../../default-messages');
const { RequestTypes } = require('../../../connection/request-types');

module.exports = class LoginExternalHandler extends DefaultHandler {
  type = RequestTypes.USER_EXTERNAL_LOGIN;
  /**
   * @param {import('../../../model/connection-message/connection-message-model').ConnectionMessage} message
   * @returns {boolean}
   */
  handle(message) {
    if (this.type !== message.type && this.nextHandler) {
      return this.nextHandler.handle(message);
    }
    if (this.type !== message.type && !this.nextHandler) {
      return this.getErrorAnswer(TYPE_INVALID);
    }

    /** @type {Map<string, import('../../../connection/connection')>} */
    const allConnection = ConnectionPool.getInstance().getAuthConnections();
    allConnection.forEach((connection) => {
      if (connection.getUser().login !== message.payload.user.login) {
        connection.innerMessageHandler(message);
      }
    });

    return true;
  }
};
