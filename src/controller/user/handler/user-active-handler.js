const UserPool = require('../../../pool/user-pool');
const DefaultHandler = require('../../default-handler');
const { TYPE_INVALID } = require('../../default-messages');
const { RequestTypes } = require('../../../connection/request-types');

module.exports = class UserActiveHandler extends DefaultHandler {
  type = RequestTypes.USER_ACTIVE;
  /**
   * @param {import('../../../model/connection-message/connection-message-model').ConnectionMessage} message
   * @returns {import('../user-controller').UserActivePayload}
   */
  handle(message) {
    if (this.type !== message.type && this.nextHandler) {
      return this.nextHandler.handle(message);
    }
    if (this.type !== message.type && !this.nextHandler) {
      return this.getErrorAnswer(TYPE_INVALID);
    }
    /** @type {import('../user-controller').UserActivePayload} */
    const result = {
      users: [],
    };

    const allUsers = UserPool.getInstance().getAllUser();
    allUsers.forEach((user) => {
      if (user.isLogined) {
        result.users.push({ login: user.login, isLogined: user.isLogined });
      }
    });

    return result;
  }
};
