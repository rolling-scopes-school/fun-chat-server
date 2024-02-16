const DefaultController = require('../default-controller');
const UserActiveHandler = require('./handler/user-active-handler');
const UserInActiveHandler = require('./handler/user-inactive-handler');

/**
 * @exports
 * @typedef {{
 * active: Array<import('../../model/user/user-model').UserPayload>,
 * }} UserActivePayload
 */

/**
 * @exports
 * @typedef {{
 * inactive: Array<import('../../model/user/user-model').UserPayload>,
 * }} UserInActivePayload
 */

module.exports = class UserController extends DefaultController {
  constructor() {
    super();
    this.handler = new UserActiveHandler();
    this.handler.setNextHandler(new UserInActiveHandler());
  }
};
