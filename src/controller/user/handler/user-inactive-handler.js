const UserPool = require('../../../pool/user-pool');
const DefaultHandler = require('../../default-handler');
const { TYPE_INVALID } = require('../../default-messages');
const { RequestTypes } = require('../../../connection/request-types');

module.exports = class UserInActiveHandler extends DefaultHandler {
  type = RequestTypes.USER_INACTIVE;
  /**
   * @param {import('../../../model/connection-message/connection-message-model').ConnectionMessage} message
   * @returns {import('../user-controller').UserInActivePayload}
   */
  handle(message) {
    if (this.type !== message.type && this.nextHandler) {
      return this.nextHandler.handle(message);
    }
    if (this.type !== message.type && !this.nextHandler) {
      return this.getErrorAnswer(TYPE_INVALID);
    }
    /** @type {import('../user-controller').UserInActivePayload} */
    const result = {
      users: [],
    };

    const allUsers = UserPool.getInstance().getAllUser();
    allUsers.forEach((user) => {
      if (!user.isLogined) {
        result.users.push({ login: user.login, isLogined: user.isLogined });
      }
    });

    return result;
  }
};
