const { RequestTypes } = require('../../src/connection/request-types');

const notCorrectMessageStructure = {
  requests: [
    {
      id: 1,
      type: '',
      payload: {},
    },
    {
      type: RequestTypes.USER_LOGIN,
      payload: {},
    },
    {
      id: '1',
      type: 1,
      payload: {},
    },
    {
      id: '1',
      payload: {},
    },
    {
      id: '1',
      type: RequestTypes.USER_LOGIN,
      payload: 'some string',
    },
    {
      id: '1',
      type: RequestTypes.USER_LOGIN,
    },
  ],
  answers: [
    {
      id: 1,
      type: RequestTypes.ERROR,
      payload: {
        error: 'incorrect request structure',
      },
    },
    {
      id: null,
      type: RequestTypes.ERROR,
      payload: {
        error: 'incorrect request structure',
      },
    },
    {
      id: '1',
      type: RequestTypes.ERROR,
      payload: {
        error: 'incorrect request structure',
      },
    },
    {
      id: '1',
      type: RequestTypes.ERROR,
      payload: {
        error: 'incorrect request structure',
      },
    },
    {
      id: '1',
      type: RequestTypes.ERROR,
      payload: {
        error: 'incorrect request structure',
      },
    },
    {
      id: '1',
      type: RequestTypes.ERROR,
      payload: {
        error: 'incorrect request structure',
      },
    },
  ],
};

const notCorrectType = {
  requests: [],
  answers: [],
};
const arrayNotCorrectTypes = ['USER', 'SERVER_PORT', 'LOG', '', ' '];
arrayNotCorrectTypes.forEach((badType, index) => {
  notCorrectType.requests.push({
    id: `${index}`,
    type: badType,
    payload: {},
  });
  notCorrectType.answers.push({
    id: `${index}`,
    type: RequestTypes.ERROR,
    payload: {
      error: 'incorrect type parameters',
    },
  });
});

const notAllowedType = {
  requests: [],
  answers: [],
};
const arrayNotAllowedTypes = [
  'ERROR',
  'USER_EXTERNAL_LOGIN',
  'USER_EXTERNAL_LOGOUT',
  'MSG_DELIVER',
  'MSG_DELETED_FROM_SERVER',
  'MSG_READED_FROM_SERVER',
  'MSG_EDITED_FROM_SERVER',
  'MSG_SENDED_FROM_SERVER',
];
arrayNotAllowedTypes.forEach((badType, index) => {
  notAllowedType.requests.push({
    id: `${index}`,
    type: badType,
    payload: {},
  });
  notAllowedType.answers.push({
    id: `${index}`,
    type: 'ERROR',
    payload: {
      error: 'incorrect type parameters',
    },
  });
});

module.exports = {
  notCorrectMessageStructure,
  notCorrectType,
  notAllowedType,
};
