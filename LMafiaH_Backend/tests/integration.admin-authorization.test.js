const request = require('supertest');

describe('Admin routes — backend-enforced authorization', () => {
  let app;
  let usersById;

  beforeEach(() => {
    jest.resetModules();
    usersById = new Map();

    jest.doMock('../src/config/database', () => ({
      user: { findUnique: jest.fn(async ({ where }) => usersById.get(where.id) || null) },
    }));
    jest.doMock('../src/services/analytics.service', () => ({
      dashboardOverview: jest.fn().mockResolvedValue({ rooms: { total: 10 } }),
    }));
    jest.doMock('../src/services/user.service', () => ({
      listUsers: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
      setUserActive: jest.fn(),
    }));

    // eslint-disable-next-line global-require
    app = require('../src/app');
  });

  const { signAccessToken } = require('../src/utils/tokens');

  function registerUser(id, role) {
    usersById.set(id, { id, role, isActive: true, email: `${id}@example.com`, firstName: 'T', lastName: 'U' });
    return signAccessToken({ sub: id, role });
  }

  test('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('rejects a CUSTOMER with 403, even for a well-formed valid token', async () => {
    const token = registerUser('cust-1', 'CUSTOMER');
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN_ROLE');
  });

  test('rejects STAFF (not privileged enough for admin analytics) with 403', async () => {
    const token = registerUser('staff-1', 'STAFF');
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('allows ADMIN through to the dashboard data', async () => {
    const token = registerUser('admin-1', 'ADMIN');
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rooms.total).toBe(10);
  });

  test('allows SUPER_ADMIN through as well', async () => {
    const token = registerUser('super-1', 'SUPER_ADMIN');
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('rejects a disabled account even with a structurally valid token', async () => {
    const token = registerUser('admin-2', 'ADMIN');
    usersById.get('admin-2').isActive = false;
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_USER_INVALID');
  });
});
