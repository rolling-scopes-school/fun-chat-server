const DefaultController = require('../default-controller');
const LoginHandler = require('./handlers/login-handler');
const LogoutHandler = require('./handlers/logout-handler');
const LoginExternalHandler = require('./handlers/login-external-handler');
const LogoutExternalHandler = require('./handlers/logout-external-handler');

/**
 * @exports
 * @typedef {{
 * login: string,
 * }} MessageAuthPayload
 */

module.exports = class AuthController extends DefaultController {
  /**
   * @param {import('../../model/user/user-model')} currentUser
   */
  constructor(currentUser = null) {
    super(currentUser);

    this.isOnlyAuthAccess = false;

    let loginCurrentUser = null;
    if (currentUser) {
      loginCurrentUser = currentUser.login;
    }
    this.handler = new LoginHandler(loginCurrentUser);
    this.handler
      .setNextHandler(new LogoutHandler(loginCurrentUser))
      .setNextHandler(new LoginExternalHandler())
      .setNextHandler(new LogoutExternalHandler());
  }
};
