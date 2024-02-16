const LoginExternalHandler = require('./login-external-handler');
const { RequestTypes } = require('../../../connection/request-types');

module.exports = class LogoutExternalHandler extends LoginExternalHandler {
  type = RequestTypes.USER_EXTERNAL_LOGOUT;
};
