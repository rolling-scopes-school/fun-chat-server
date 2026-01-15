const Socket = require('../src/socket');
const { createClient, waitSomeAnswers, waitTimeAnswers } = require('./utils/client');
const { getAuthUserRequest, getAnotherUsersRequest } = require('./requests/user-case');

describe('Get another users info', () => {
  let server;
  beforeEach(async () => {
    server = new Socket();
  });
  afterEach(async () => {
    await server.close();
  });

  test('Get all not active users', async () => {
    const countAnotherUsers = 5;

    const anotherUsersRequest = getAnotherUsersRequest();
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];
    const anotherUsers = [];

    const client = await createClient();

    client.send(JSON.stringify(userFirst.request.login));
    for (let i = 0; i < countAnotherUsers; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const anotherClient = await createClient();
      anotherUsers.push(anotherClient);

      const anotherUser = getAuthUserRequest();
      anotherClient.send(JSON.stringify(anotherUser.request.login));
      anotherClient.send(JSON.stringify(anotherUser.request.logout));

      const user = {
        login: anotherUser.request.login.payload.user.login,
        isLogined: false,
      };
      anotherUsersRequest.answer.getAllNotActive.payload.users.push(user);
    }
    await waitTimeAnswers(5);

    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    client.send(JSON.stringify(anotherUsersRequest.request.getAllNotActive));
    await waitSomeAnswers(serverAnswers, 1);

    expect(serverAnswers[0]).toEqual(anotherUsersRequest.answer.getAllNotActive);

    client.close();
    for (let i = 0; i < anotherUsers.length; i += 1) {
      anotherUsers[i].close();
    }
  });
  test('Not logged user get all not active users', async () => {
    const countAnotherUsers = 5;

    const anotherUsersRequest = getAnotherUsersRequest();
    const serverAnswers = [];
    const anotherUsers = [];

    const client = await createClient();

    for (let i = 0; i < countAnotherUsers; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const anotherClient = await createClient();
      anotherUsers.push(anotherClient);

      const anotherUser = getAuthUserRequest();
      anotherClient.send(JSON.stringify(anotherUser.request.login));
      anotherClient.send(JSON.stringify(anotherUser.request.logout));

      const user = {
        login: anotherUser.request.login.payload.user.login,
        isLogined: false,
      };
      anotherUsersRequest.answer.getAllNotActive.payload.users.push(user);
    }
    await waitTimeAnswers(5);

    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    client.send(JSON.stringify(anotherUsersRequest.request.getAllNotActive));
    await waitSomeAnswers(serverAnswers, 1);

    expect(serverAnswers[0]).toEqual(anotherUsersRequest.error.userNotAuth);

    client.close();
    for (let i = 0; i < anotherUsers.length; i += 1) {
      anotherUsers[i].close();
    }
  });
  test('Get all active users', async () => {
    const countAnotherUsers = 5;

    const anotherUsersRequest = getAnotherUsersRequest();
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];
    const anotherUsers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    for (let i = 0; i < countAnotherUsers; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const anotherClient = await createClient();
      anotherUsers.push(anotherClient);

      const anotherUser = getAuthUserRequest();
      anotherClient.send(JSON.stringify(anotherUser.request.login));

      const user = {
        login: anotherUser.request.login.payload.user.login,
        isLogined: true,
      };
      anotherUsersRequest.answer.getAllActive.payload.users.push(user);
    }
    const user = {
      login: userFirst.request.login.payload.user.login,
      isLogined: true,
    };
    anotherUsersRequest.answer.getAllActive.payload.users.push(user);

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    client.send(JSON.stringify(anotherUsersRequest.request.getAllActive));
    await waitSomeAnswers(serverAnswers, 2);

    expect(serverAnswers[1]).toEqual(anotherUsersRequest.answer.getAllActive);

    client.close();
    for (let i = 0; i < anotherUsers.length; i += 1) {
      anotherUsers[i].close();
    }
  });
  test('Not logged get all active users', async () => {
    const countAnotherUsers = 5;

    const anotherUsersRequest = getAnotherUsersRequest();
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];
    const anotherUsers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    for (let i = 0; i < countAnotherUsers; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const anotherClient = await createClient();
      anotherUsers.push(anotherClient);

      const anotherUser = getAuthUserRequest();
      anotherClient.send(JSON.stringify(anotherUser.request.login));

      const user = {
        login: anotherUser.request.login.payload.user.login,
        isLogined: true,
      };
      anotherUsersRequest.answer.getAllActive.payload.users.push(user);
    }
    const user = {
      login: userFirst.request.login.payload.user.login,
      isLogined: true,
    };
    anotherUsersRequest.answer.getAllActive.payload.users.push(user);

    client.send(JSON.stringify(anotherUsersRequest.request.getAllActive));
    await waitSomeAnswers(serverAnswers, 1);

    expect(serverAnswers[0]).toEqual(anotherUsersRequest.error.userNotAuth);

    client.close();
    for (let i = 0; i < anotherUsers.length; i += 1) {
      anotherUsers[i].close();
    }
  });
});
