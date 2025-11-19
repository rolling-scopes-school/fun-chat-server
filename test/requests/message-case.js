const { RequestTypes } = require('../../src/connection/request-types');

let requestIndex = 0;

function getMessageRequest(userFirst, userSecond) {
  requestIndex += 1;
  return {
    request: {
      messageToUser: {
        id: `${requestIndex}`,
        type: RequestTypes.MSG_SEND,
        payload: {
          message: {
            to: userSecond.request.login.payload.user.login,
            text: `text ${requestIndex}`,
          },
        },
      },
      messageHistoryToUser: {
        id: `${requestIndex}`,
        type: RequestTypes.MSG_FROM_USER,
        payload: {
          user: {
            login: userSecond.request.login.payload.user.login,
          },
        },
      },
      messageReaded: {
        id: `${requestIndex}`,
        type: RequestTypes.MSG_READED,
        payload: {
          message: {
            id: '',
          },
        },
      },
      messageDeleted: {
        id: `${requestIndex}`,
        type: RequestTypes.MSG_DELETE,
        payload: {
          message: {
            id: '',
          },
        },
      },
      messageEdited: {
        id: `${requestIndex}`,
        type: RequestTypes.MSG_EDIT,
        payload: {
          message: {
            id: '',
            text: `text ${requestIndex}`,
          },
        },
      },
    },
    answer: {
      messageToLogged: {
        from: {
          id: `${requestIndex}`,
          type: RequestTypes.MSG_SEND,
          payload: {
            message: {
              id: '',
              from: userFirst.request.login.payload.user.login,
              to: userSecond.request.login.payload.user.login,
              text: `text ${requestIndex}`,
              datetime: 0,
              status: {
                isDelivered: true,
                isReaded: false,
                isEdited: false,
              },
            },
          },
        },
        to: {
          id: null,
          type: RequestTypes.MSG_SEND,
          payload: {
            message: {
              id: '',
              from: userFirst.request.login.payload.user.login,
              to: userSecond.request.login.payload.user.login,
              text: `text ${requestIndex}`,
              datetime: 0,
              status: {
                isDelivered: true,
                isReaded: false,
                isEdited: false,
              },
            },
          },
        },
      },
      messageToNotLogged: {
        from: {
          id: `${requestIndex}`,
          type: RequestTypes.MSG_SEND,
          payload: {
            message: {
              id: '',
              from: userFirst.request.login.payload.user.login,
              to: userSecond.request.login.payload.user.login,
              text: `text ${requestIndex}`,
              datetime: 0,
              status: {
                isDelivered: false,
                isReaded: false,
                isEdited: false,
              },
            },
          },
        },
        to: null,
      },
      messageHistoryToUser: {
        id: `${requestIndex}`,
        type: RequestTypes.MSG_FROM_USER,
        payload: {
          messages: [],
        },
      },
      messageDelivered: {
        id: null,
        type: RequestTypes.MSG_DELIVERED,
        payload: {
          message: {
            id: '',
            status: {
              isDelivered: true,
            },
          },
        },
      },
      messageReaded: {
        from: {
          id: `${requestIndex}`,
          type: RequestTypes.MSG_READED,
          payload: {
            message: {
              id: '',
              status: {
                isReaded: true,
              },
            },
          },
        },
        to: {
          id: null,
          type: RequestTypes.MSG_READED,
          payload: {
            message: {
              id: '',
              status: {
                isReaded: true,
              },
            },
          },
        },
      },
      messageDeleted: {
        from: {
          id: `${requestIndex}`,
          type: RequestTypes.MSG_DELETE,
          payload: {
            message: {
              id: '',
              status: {
                isDeleted: true,
              },
            },
          },
        },
        to: {
          id: null,
          type: RequestTypes.MSG_DELETE,
          payload: {
            message: {
              id: '',
              status: {
                isDeleted: true,
              },
            },
          },
        },
      },
      messageEdited: {
        from: {
          id: `${requestIndex}`,
          type: RequestTypes.MSG_EDIT,
          payload: {
            message: {
              id: '',
              text: `text ${requestIndex}`,
              status: {
                isEdited: true,
              },
            },
          },
        },
        to: {
          id: null,
          type: RequestTypes.MSG_EDIT,
          payload: {
            message: {
              id: '',
              text: `text ${requestIndex}`,
              status: {
                isEdited: true,
              },
            },
          },
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
      messageToMySelf: {
        id: `${requestIndex}`,
        type: RequestTypes.ERROR,
        payload: {
          error: 'sender and recipient logins are the same',
        },
      },
      messageToNotFound: {
        id: `${requestIndex}`,
        type: RequestTypes.ERROR,
        payload: {
          error: 'the user with the specified login does not exist',
        },
      },
      messageToNotAuth: {
        id: `${requestIndex}`,
        type: RequestTypes.ERROR,
        payload: {
          error: 'user not registered or not logged',
        },
      },
      messageNotCorrectId: {
        id: `${requestIndex}`,
        type: RequestTypes.ERROR,
        payload: {
          error: 'incorrect message id',
        },
      },
      messageUserNotRecipient: {
        id: `${requestIndex}`,
        type: RequestTypes.ERROR,
        payload: {
          error: 'user not recipient cannot be executed',
        },
      },
      messageUserNotSender: {
        id: `${requestIndex}`,
        type: RequestTypes.ERROR,
        payload: {
          error: 'user not sender cannot be executed',
        },
      },
      messageIncorrectPayload: {
        id: `${requestIndex}`,
        type: RequestTypes.ERROR,
        payload: {
          error: 'incorrect payload parameters',
        },
      },
    },
  };
}

module.exports = {
  getMessageRequest,
};
