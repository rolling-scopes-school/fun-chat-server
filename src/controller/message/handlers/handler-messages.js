const HANDLER_ENTITY_INVALID = 'incorrect payload parameters';

const HANDLER_ID_MESSAGE_INVALID = 'incorrect message id';
const HANDLER_RECEIVER_INVALID = 'sender and recipient logins are the same';
const HANDLER_RECEIVER_NOT_FOUND = 'the user with the specified login does not exist';
const HANDLER_USER_NOT_SENDER = 'user not sender cannot be executed';
const HANDLER_USER_NOT_RECEIVER = 'user not recipient cannot be executed';
const HANDLER_USER_NOT_REGISTERED = 'user not registered or not logged';

module.exports = {
  HANDLER_ENTITY_INVALID,
  HANDLER_ID_MESSAGE_INVALID,
  HANDLER_RECEIVER_INVALID,
  HANDLER_RECEIVER_NOT_FOUND,
  HANDLER_USER_NOT_SENDER,
  HANDLER_USER_NOT_RECEIVER,
  HANDLER_USER_NOT_REGISTERED,
};
