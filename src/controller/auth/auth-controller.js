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
  constructor() {
    super();

    this.handler = new LoginHandler();
    this.handler
      .setNextHandler(new LogoutHandler())
      .setNextHandler(new LoginExternalHandler())
      .setNextHandler(new LogoutExternalHandler());
  }
};
