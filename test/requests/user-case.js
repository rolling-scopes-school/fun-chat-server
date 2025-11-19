const { RequestTypes } = require('../../src/connection/request-types');

let userIndex = 0;
let requestIndex = 0;

function getAuthUserRequest() {
  userIndex += 1;
  return {
    request: {
      login: {
        id: `${userIndex}`,
        type: RequestTypes.USER_LOGIN,
        payload: {
          user: {
            login: `userName${userIndex}`,
            password: `userPass${userIndex}`,
          },
        },
      },
      logout: {
        id: `${userIndex}`,
        type: RequestTypes.USER_LOGOUT,
        payload: {
          user: {
            login: `userName${userIndex}`,
            password: `userPass${userIndex}`,
          },
        },
      },
    },
    answer: {
      login: {
        id: `${userIndex}`,
        type: RequestTypes.USER_LOGIN,
        payload: {
          user: {
            login: `userName${userIndex}`,
            isLogined: true,
          },
        },
      },
      logout: {
        id: `${userIndex}`,
        type: RequestTypes.USER_LOGOUT,
        payload: {
          user: {
            login: `userName${userIndex}`,
            isLogined: false,
          },
        },
      },
      loginExternal: {
        id: null,
        type: RequestTypes.USER_EXTERNAL_LOGIN,
        payload: {
          user: {
            login: `userName${userIndex}`,
            isLogined: true,
          },
        },
      },
      logoutExternal: {
        id: null,
        type: RequestTypes.USER_EXTERNAL_LOGOUT,
        payload: {
          user: {
            login: `userName${userIndex}`,
            isLogined: false,
          },
        },
      },
    },
    error: {
      alreadyAuth: {
        id: `${userIndex}`,
        type: RequestTypes.ERROR,
        payload: {
          error: 'a user with this login is already authorized',
        },
      },
      anotherUserAuthInConnection: {
        id: `${userIndex}`,
        type: RequestTypes.ERROR,
        payload: {
          error: 'another user is already authorized in this connection',
        },
      },
      incorrectPass: {
        id: `${userIndex}`,
        type: RequestTypes.ERROR,
        payload: {
          error: 'incorrect password',
        },
      },
      incorrectLogin: {
        id: `${userIndex}`,
        type: RequestTypes.ERROR,
        payload: {
          error: 'there is no user with this login',
        },
      },
      notAuth: {
        id: `${userIndex}`,
        type: RequestTypes.ERROR,
        payload: {
          error: 'the user was not authorized',
        },
      },
      incorrectPayload: {
        id: `${userIndex}`,
        type: RequestTypes.ERROR,
        payload: {
          error: 'incorrect payload parameters',
        },
      },
    },
  };
}

function getAnotherUsersRequest() {
  requestIndex += 1;
  return {
    request: {
      getAllActive: {
        id: `${requestIndex}`,
        type: RequestTypes.USER_ACTIVE,
        payload: null,
      },
      getAllNotActive: {
        id: `${requestIndex}`,
        type: RequestTypes.USER_INACTIVE,
        payload: null,
      },
    },
    answer: {
      getAllActive: {
        id: `${requestIndex}`,
        type: RequestTypes.USER_ACTIVE,
        payload: {
          users: [],
        },
      },
      getAllNotActive: {
        id: `${requestIndex}`,
        type: RequestTypes.USER_INACTIVE,
        payload: {
          users: [],
        },
      },
    },
    error: {
      userNotAuth: {
        id: `${requestIndex}`,
        type: RequestTypes.ERROR,
        payload: {
          error: 'the user was not authorized cannot be executed',
        },
      },
    },
  };
}

module.exports = {
  getAuthUserRequest,
  getAnotherUsersRequest,
};
