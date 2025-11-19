const UserModel = require('../../../model/user/user-model');
const UserState = require('../../../pool/user-pool');
const DefaultHandler = require('../../default-handler');
const {
  HANDLER_LOGIN_INVALID_TEXT,
  HANDLER_LOGOUT_INVALID_TEXT,
  HANDLER_PASSWORD_INVALID_TEXT,
} = require('./handler-messages');
const { PAYLOAD_INVALID, TYPE_INVALID } = require('../../default-messages');
const { RequestTypes } = require('../../../connection/request-types');

module.exports = class LogoutHandler extends DefaultHandler {
  type = RequestTypes.USER_LOGOUT;
  /**
   * @param {string} currentUserLogin
   */
  constructor(currentUserLogin) {
    super();
    this.currentUserLogin = currentUserLogin;
  }
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
        isLogined: false,
      },
    };

    const userState = UserState.getInstance();
    const userModel = userState.getUser(connectionMessage.payload.user.login);

    if (userModel === null || userModel.login === null) {
      return this.getErrorAnswer(HANDLER_LOGIN_INVALID_TEXT);
    }
    if (userModel.password !== connectionMessage.payload.user.password) {
      return this.getErrorAnswer(HANDLER_PASSWORD_INVALID_TEXT);
    }
    if (!userModel.isLogined || userModel.login !== this.currentUserLogin) {
      return this.getErrorAnswer(HANDLER_LOGOUT_INVALID_TEXT);
    }

    userModel.isLogined = false;

    return result;
  }
};
