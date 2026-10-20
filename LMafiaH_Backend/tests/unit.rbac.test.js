const { authorize, authorizeOwnerOrRoles } = require('../src/middleware/rbac');
const AppError = require('../src/utils/AppError');

function mockRes() { return {}; }
function mockNext() { return jest.fn(); }

describe('RBAC middleware — authorize()', () => {
  test('calls next() with no args when the user has an allowed role', () => {
    const req = { user: { id: 'u1', role: 'ADMIN' } };
    const next = mockNext();
    authorize('ADMIN', 'SUPER_ADMIN')(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  test('calls next(AppError 403) when the role is not permitted', () => {
    const req = { user: { id: 'u1', role: 'CUSTOMER' } };
    const next = mockNext();
    authorize('ADMIN', 'SUPER_ADMIN')(req, mockRes(), next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN_ROLE');
  });

  test('never trusts a role claimed anywhere except req.user (populated only from the DB)', () => {
    // Simulates a malicious client trying to smuggle a role via the body —
    // authorize() must ignore it entirely, since it only reads req.user.
    const req = { user: { id: 'u1', role: 'CUSTOMER' }, body: { role: 'SUPER_ADMIN' } };
    const next = mockNext();
    authorize('SUPER_ADMIN')(req, mockRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  test('calls next(AppError 401) when there is no authenticated user at all', () => {
    const req = {};
    const next = mockNext();
    authorize('CUSTOMER')(req, mockRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });
});

describe('RBAC middleware — authorizeOwnerOrRoles()', () => {
  test('allows the resource owner through', async () => {
    const req = { user: { id: 'owner-1', role: 'CUSTOMER' } };
    const next = mockNext();
    const mw = authorizeOwnerOrRoles(async () => 'owner-1', 'STAFF', 'ADMIN');
    await mw(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  test('rejects a non-owner, non-privileged user', async () => {
    const req = { user: { id: 'someone-else', role: 'CUSTOMER' } };
    const next = mockNext();
    const mw = authorizeOwnerOrRoles(async () => 'owner-1', 'STAFF', 'ADMIN');
    await mw(req, mockRes(), next);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  test('lets a bypass role through regardless of ownership', async () => {
    const req = { user: { id: 'staff-1', role: 'STAFF' } };
    const next = mockNext();
    const mw = authorizeOwnerOrRoles(async () => 'owner-1', 'STAFF', 'ADMIN');
    await mw(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });
});
