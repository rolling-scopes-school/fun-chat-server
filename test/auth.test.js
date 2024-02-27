const Socket = require('../src/socket');
const { createClient, waitTimeAnswers, waitSomeAnswers } = require('./utils/client');
const { getAuthUserRequest } = require('./requests/user-case');

describe('Login test cases', () => {
  let server;
  beforeEach(async () => {
    server = new Socket();
  });
  afterEach(async () => {
    await server.close();
  });

  test('One user login success', async () => {
    const client = await createClient();

    const userFirst = getAuthUserRequest();
    const serverAnswers = [];
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));

    await waitTimeAnswers(5);
    expect(serverAnswers.length === 1).toBe(true);
    expect(serverAnswers[0]).toEqual(userFirst.answer.login);

    client.close();
  });
  test('Many users login success', async () => {
    const countClients = 10;
    const clients = [];
    const users = [];
    const serverAnswers = [];
    for (let i = 0; i < countClients; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const client = await createClient();
      clients.push(client);
      client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

      const user = getAuthUserRequest();
      users.push(user);
      client.send(JSON.stringify(user.request.login));
    }

    const countAnswers = (countClients * (countClients + 1)) / 2;
    await waitSomeAnswers(serverAnswers, countAnswers);

    for (let i = 0; i < countClients; i += 1) {
      const srcAnswer = users[i].answer.login;
      const isAvalaible = serverAnswers.some((srvAnswer) => {
        return (
          srvAnswer.id === srcAnswer.id &&
          srvAnswer.type === srcAnswer.type &&
          srvAnswer.payload.user.login === srcAnswer.payload.user.login &&
          srvAnswer.payload.user.isLogined === srcAnswer.payload.user.isLogined
        );
      });
      expect(isAvalaible).toBe(true);
    }

    for (let i = 0; i < countClients; i += 1) {
      clients[i].close();
    }
  });
  test('One user two attempts login (in one connection)', async () => {
    const client = await createClient();

    const userFirst = getAuthUserRequest();
    const serverAnswers = [];
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    client.send(JSON.stringify(userFirst.request.login));

    await waitSomeAnswers(serverAnswers, 2);
    expect(serverAnswers[0]).toEqual(userFirst.answer.login);
    expect(serverAnswers[1]).toEqual(userFirst.error.alreadyAuth);

    client.close();
  });
  test('One user two attempts login (in different connections)', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    const clientSecond = await createClient();
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    clientSecond.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 2);

    expect(serverAnswers[0]).toEqual(userFirst.answer.login);
    expect(serverAnswers[1]).toEqual(userFirst.error.alreadyAuth);

    client.close();
    clientSecond.close();
  });
  test('One user two attempts login (in different connections) and close connection', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    const clientSecond = await createClient();
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    clientSecond.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 2);

    expect(serverAnswers[0]).toEqual(userFirst.answer.login);
    expect(serverAnswers[1]).toEqual(userFirst.error.alreadyAuth);

    clientSecond.close();

    await waitTimeAnswers(5);
    expect(serverAnswers.length).toBe(2);

    client.close();
  });
  test('One user two attempts login (in different connections) after logout', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    const clientSecond = await createClient();
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 2);
    clientSecond.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    expect(serverAnswers[2]).toEqual(userFirst.answer.login);

    client.close();
    clientSecond.close();
  });
  test('One user login with invalid password', async () => {
    const client = await createClient();

    const userFirst = getAuthUserRequest();
    const serverAnswers = [];
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 2);
    userFirst.request.login.payload.user.password = '1234';
    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 3);

    expect(serverAnswers[0]).toEqual(userFirst.answer.login);
    expect(serverAnswers[1]).toEqual(userFirst.answer.logout);
    expect(serverAnswers[2]).toEqual(userFirst.error.incorrectPass);

    client.close();
  });
  test('Another user login is already logged', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    client.send(JSON.stringify(userFirst.request.login));

    const clientSecond = await createClient();
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    clientSecond.send(JSON.stringify(userFirst.request.login));

    await waitSomeAnswers(serverAnswers, 2);
    expect(serverAnswers[0]).toEqual(userFirst.answer.login);
    expect(serverAnswers[1]).toEqual(userFirst.error.alreadyAuth);

    client.close();
    clientSecond.close();
  });
  test('Another user login with invalid password is already logged ', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    client.send(JSON.stringify(userFirst.request.login));

    const clientSecond = await createClient();
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    userFirst.request.login.payload.user.password = '1234';
    clientSecond.send(JSON.stringify(userFirst.request.login));

    await waitSomeAnswers(serverAnswers, 2);
    expect(serverAnswers[0]).toEqual(userFirst.answer.login);
    expect(serverAnswers[1]).toEqual(userFirst.error.alreadyAuth);

    client.close();
    clientSecond.close();
  });
  test('One user login with invalid payload', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    const { login, password } = userFirst.request.login.payload.user;
    userFirst.request.login.payload = {
      login,
      password,
    };
    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    await waitTimeAnswers(5);

    expect(serverAnswers.length).toBe(1);
    expect(serverAnswers[0]).toEqual(userFirst.error.incorrectPayload);

    client.close();
  });
  test('One user login with invalid type login', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    userFirst.request.login.payload.user.login = 1234;
    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    await waitTimeAnswers(5);

    expect(serverAnswers.length).toBe(1);
    expect(serverAnswers[0]).toEqual(userFirst.error.incorrectPayload);

    client.close();
  });
  test('One user login with invalid type password', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    userFirst.request.login.payload.user.password = 1234;
    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    await waitTimeAnswers(5);

    expect(serverAnswers.length).toBe(1);
    expect(serverAnswers[0]).toEqual(userFirst.error.incorrectPayload);

    client.close();
  });
  test('One user login without login', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    delete userFirst.request.login.payload.user.login;
    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    await waitTimeAnswers(5);

    expect(serverAnswers.length).toBe(1);
    expect(serverAnswers[0]).toEqual(userFirst.error.incorrectPayload);

    client.close();
  });
  test('One user login without password', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    delete userFirst.request.login.payload.user.password;
    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    await waitTimeAnswers(5);

    expect(serverAnswers.length).toBe(1);
    expect(serverAnswers[0]).toEqual(userFirst.error.incorrectPayload);

    client.close();
  });
});

describe('Logout test cases', () => {
  let server;
  beforeEach(async () => {
    server = new Socket();
  });
  afterEach(async () => {
    await server.close();
  });

  test('One user logout success', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 2);

    expect(serverAnswers[0]).toEqual(userFirst.answer.login);
    expect(serverAnswers[1]).toEqual(userFirst.answer.logout);

    client.close();
  });
  test('One user logout for not logged user', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 2);
    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 3);

    expect(serverAnswers[2]).toEqual(userFirst.error.notAuth);

    client.close();
  });
  test('One user two attempts logout (in one connection)', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    client.send(JSON.stringify(userFirst.request.logout));
    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 3);

    expect(serverAnswers[0]).toEqual(userFirst.answer.login);
    expect(serverAnswers[1]).toEqual(userFirst.answer.logout);
    expect(serverAnswers[2]).toEqual(userFirst.error.notAuth);

    client.close();
  });
  test('One user two attempts logout (in different connection)', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    const clientSecond = await createClient();
    clientSecond.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 2);
    clientSecond.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 3);

    expect(serverAnswers[0]).toEqual(userFirst.answer.login);
    expect(serverAnswers[1]).toEqual(userFirst.answer.logout);
    expect(serverAnswers[2]).toEqual(userFirst.error.notAuth);

    client.close();
    clientSecond.close();
  });
  test('One user logout with invalid password', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    userFirst.request.logout.payload.user.password = '1234';
    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 2);

    expect(serverAnswers[0]).toEqual(userFirst.answer.login);
    expect(serverAnswers[1]).toEqual(userFirst.error.incorrectPass);

    client.close();
  });
  test('One user logout with invalid login', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    userFirst.request.logout.payload.user.login = '1234';
    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 2);

    expect(serverAnswers[1]).toEqual(userFirst.error.incorrectLogin);

    client.close();
  });
  test('One user logout with invalid payload', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);

    const { login, password } = userFirst.request.logout.payload.user;
    userFirst.request.logout.payload = {
      login,
      password,
    };
    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 2);
    await waitTimeAnswers(5);

    expect(serverAnswers[1]).toEqual(userFirst.error.incorrectPayload);
    expect(serverAnswers.length).toBe(2);

    client.close();
  });
  test('One user logout with invalid type login', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);

    userFirst.request.logout.payload.user.login = 1234;
    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 2);
    await waitTimeAnswers(5);

    expect(serverAnswers[1]).toEqual(userFirst.error.incorrectPayload);
    expect(serverAnswers.length).toBe(2);

    client.close();
  });
  test('One user logout with invalid type password', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);

    userFirst.request.logout.payload.user.password = 1234;
    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 2);
    await waitTimeAnswers(5);

    expect(serverAnswers[1]).toEqual(userFirst.error.incorrectPayload);
    expect(serverAnswers.length).toBe(2);

    client.close();
  });
  test('One user logout without login', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);

    delete userFirst.request.logout.payload.user.login;
    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 2);
    await waitTimeAnswers(5);

    expect(serverAnswers[1]).toEqual(userFirst.error.incorrectPayload);
    expect(serverAnswers.length).toBe(2);

    client.close();
  });
  test('One user logout without password', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);

    delete userFirst.request.logout.payload.user.password;
    client.send(JSON.stringify(userFirst.request.logout));
    await waitSomeAnswers(serverAnswers, 2);
    await waitTimeAnswers(5);

    expect(serverAnswers[1]).toEqual(userFirst.error.incorrectPayload);
    expect(serverAnswers.length).toBe(2);

    client.close();
  });
});

describe('External login cases', () => {
  let socket;
  beforeEach(async () => {
    socket = new Socket();
  });
  afterEach(async () => {
    await socket.close();
  });

  test('Another user login success', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    client.send(JSON.stringify(userFirst.request.login));

    const clientSecond = await createClient();
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 2);

    expect(serverAnswers[1]).toEqual(userSecond.answer.loginExternal);

    client.close();
    clientSecond.close();
  });
  test('Another user login fail with invalid password', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    client.send(JSON.stringify(userFirst.request.login));

    const clientSecond = await createClient();
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 2);
    clientSecond.send(JSON.stringify(userSecond.request.logout));
    await waitSomeAnswers(serverAnswers, 3);
    userSecond.request.login.payload.user.password = '1234';
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitTimeAnswers(5);

    expect(serverAnswers.length).toBe(3);

    client.close();
    clientSecond.close();
  });
  test('Another user login fail because of current already logged', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);

    const clientSecond = await createClient();
    clientSecond.send(JSON.stringify(userFirst.request.login));
    await waitTimeAnswers(5);

    expect(serverAnswers.length).toBe(1);

    client.close();
    clientSecond.close();
  });
});
describe('External logout cases', () => {
  let socket;
  beforeEach(async () => {
    socket = new Socket();
  });
  afterEach(async () => {
    await socket.close();
  });

  test('Another user logout success', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    const clientSecond = await createClient();

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 2);
    clientSecond.send(JSON.stringify(userSecond.request.logout));
    await waitSomeAnswers(serverAnswers, 3);

    expect(serverAnswers[2]).toEqual(userSecond.answer.logoutExternal);

    client.close();
    clientSecond.close();
  });
  test('Another user logout fail with invalid password', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    const clientSecond = await createClient();

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 2);
    userSecond.request.logout.payload.user.password = '1234';
    clientSecond.send(JSON.stringify(userSecond.request.logout));
    await waitTimeAnswers(5);

    expect(serverAnswers.length).toBe(2);

    client.close();
    clientSecond.close();
  });
  test('Another user login fail because not logged', async () => {
    const userFirst = getAuthUserRequest();
    const userSecond = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    const clientSecond = await createClient();

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    clientSecond.send(JSON.stringify(userSecond.request.login));
    await waitSomeAnswers(serverAnswers, 2);
    clientSecond.send(JSON.stringify(userSecond.request.logout));
    await waitSomeAnswers(serverAnswers, 3);
    clientSecond.send(JSON.stringify(userSecond.request.logout));
    await waitTimeAnswers(5);

    expect(serverAnswers.length).toBe(3);

    client.close();
    clientSecond.close();
  });
  test('Another user logout fail because of current already logged', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    const clientSecond = await createClient();

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    clientSecond.send(JSON.stringify(userFirst.request.logout));
    await waitTimeAnswers(5);

    expect(serverAnswers.length).toBe(1);

    clientSecond.close();
  });
  test('Another user logout fail because of current already logged and invalid password', async () => {
    const userFirst = getAuthUserRequest();
    const serverAnswers = [];

    const client = await createClient();
    client.on('message', (message) => serverAnswers.push(JSON.parse(message)));
    const clientSecond = await createClient();

    client.send(JSON.stringify(userFirst.request.login));
    await waitSomeAnswers(serverAnswers, 1);
    userFirst.request.logout.payload.user.password = '1234';
    clientSecond.send(JSON.stringify(userFirst.request.logout));
    await waitTimeAnswers(5);

    expect(serverAnswers.length).toBe(1);

    client.close();
    clientSecond.close();
  });
});
