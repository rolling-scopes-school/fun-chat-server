const UserModel = require('../../../model/user/user-model');
const UserState = require('../../../pool/user-pool');
const DefaultHandler = require('../../default-handler');
const { HANDLER_USER_ALREADY_LOGGED_TEXT, HANDLER_PASSWORD_INVALID_TEXT } = require('./handler-messages');
const { PAYLOAD_INVALID, TYPE_INVALID } = require('../../default-messages');
const { RequestTypes } = require('../../../connection/request-types');

module.exports = class LoginHandler extends DefaultHandler {
  type = RequestTypes.USER_LOGIN;

  /**
   * @param {import('../../../model/connection-message/connection-message-model').ConnectionMessage} connectionMessage
   * @returns {import('../../default-controller').DefaultPayload}
   */
  handle(connectionMessage) {
    if (this.type !== connectionMessage.type && this.nextHandler) {
      return this.nextHandler.handle(connectionMessage);
    }
    if (this.type !== connectionMessage.type && !this.nextHandler) {
      return this.getErrorAnswer(TYPE_INVALID);
    }

    if (!UserModel.isCorrectPayload(connectionMessage.payload.user)) {
      return this.getErrorAnswer(PAYLOAD_INVALID);
    }

    const result = {
      user: {
        login: connectionMessage.payload.user.login,
        isLogined: true,
      },
    };

    const userState = UserState.getInstance();
    const userModel = userState.getUser(connectionMessage.payload.user.login);

    if (userModel === null) {
      const newUser = new UserModel();
      newUser.login = connectionMessage.payload.user.login;
      newUser.password = connectionMessage.payload.user.password;

      const isUserAdded = userState.addUser(newUser);
      newUser.isLogined = isUserAdded;

      return result;
    }
    if (userModel.isLogined) {
      return this.getErrorAnswer(HANDLER_USER_ALREADY_LOGGED_TEXT);
    }
    if (userModel.password !== connectionMessage.payload.user.password) {
      return this.getErrorAnswer(HANDLER_PASSWORD_INVALID_TEXT);
    }

    userModel.isLogined = true;

    return result;
  }
};
