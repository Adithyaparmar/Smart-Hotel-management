describe('auth.service — registration & login', () => {
  let authService;
  let prismaMock;

  beforeEach(() => {
    jest.resetModules();
    const users = new Map();

    prismaMock = {
      user: {
        findFirst: jest.fn(async ({ where }) => {
          const email = where.OR?.find((c) => c.email)?.email;
          return [...users.values()].find((u) => u.email === email) || null;
        }),
        findUnique: jest.fn(async ({ where }) => users.get(where.email) || users.get(where.id) || null),
        create: jest.fn(async ({ data }) => {
          const user = { id: `user-${users.size + 1}`, isActive: true, ...data };
          users.set(user.id, user); users.set(user.email, user);
          return user;
        }),
        update: jest.fn(async ({ where, data }) => {
          const user = users.get(where.id);
          Object.assign(user, data);
          return user;
        }),
      },
      customerProfile: { create: jest.fn().mockResolvedValue({}) },
      refreshToken: { create: jest.fn().mockResolvedValue({}) },
      $transaction: jest.fn((arg) => (Array.isArray(arg) ? Promise.all(arg) : arg(prismaMock))),
    };

    jest.doMock('../src/config/database', () => prismaMock);
    jest.doMock('../src/services/notification.service', () => ({ notify: jest.fn().mockResolvedValue({}) }));
    // eslint-disable-next-line global-require
    authService = require('../src/services/auth.service');
  });

  test('registers a new customer with a hashed password (never plaintext)', async () => {
    const user = await authService.register({
      email: 'giulia@example.com', password: 'StrongPass1', firstName: 'Giulia', lastName: 'Ferrara',
    });
    expect(user.email).toBe('giulia@example.com');
    expect(user.role).toBe('CUSTOMER');
    expect(user).not.toHaveProperty('passwordHash');

    const createCall = prismaMock.user.create.mock.calls[0][0].data;
    expect(createCall.passwordHash).not.toBe('StrongPass1');
    expect(createCall.passwordHash.startsWith('$argon2id$')).toBe(true);
  });

  test('rejects registration with a duplicate email', async () => {
    await authService.register({ email: 'dup@example.com', password: 'StrongPass1', firstName: 'A', lastName: 'B' });
    await expect(authService.register({ email: 'dup@example.com', password: 'StrongPass1', firstName: 'C', lastName: 'D' }))
      .rejects.toMatchObject({ code: 'ACCOUNT_EXISTS' });
  });

  test('logs in with correct credentials and issues an access + refresh token', async () => {
    await authService.register({ email: 'login@example.com', password: 'StrongPass1', firstName: 'A', lastName: 'B' });
    const result = await authService.login({ email: 'login@example.com', password: 'StrongPass1' });
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user.email).toBe('login@example.com');
  });

  test('rejects login with an incorrect password without revealing which field was wrong', async () => {
    await authService.register({ email: 'login2@example.com', password: 'StrongPass1', firstName: 'A', lastName: 'B' });
    await expect(authService.login({ email: 'login2@example.com', password: 'WrongPassword1' }))
      .rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', statusCode: 401 });
  });

  test('rejects login for a disabled account', async () => {
    await authService.register({ email: 'disabled@example.com', password: 'StrongPass1', firstName: 'A', lastName: 'B' });
    const user = await prismaMock.user.findUnique({ where: { email: 'disabled@example.com' } });
    user.isActive = false;
    await expect(authService.login({ email: 'disabled@example.com', password: 'StrongPass1' }))
      .rejects.toMatchObject({ code: 'ACCOUNT_DISABLED', statusCode: 403 });
  });
});
