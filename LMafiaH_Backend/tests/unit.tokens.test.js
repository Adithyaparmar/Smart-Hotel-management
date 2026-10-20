const { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken, hashToken } = require('../src/utils/tokens');

describe('JWT access/refresh tokens', () => {
  test('signs and verifies an access token round-trip', () => {
    const token = signAccessToken({ sub: 'user-123', role: 'CUSTOMER' });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user-123');
    expect(payload.role).toBe('CUSTOMER');
  });

  test('rejects a tampered token', () => {
    const token = signAccessToken({ sub: 'user-123', role: 'CUSTOMER' });
    const tampered = `${token.slice(0, -2)}xx`;
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  test('refresh token hash is deterministic and one-way', () => {
    const token = signRefreshToken({ sub: 'user-123' });
    const h1 = hashToken(token);
    const h2 = hashToken(token);
    expect(h1).toBe(h2);
    expect(h1).not.toBe(token);
    expect(verifyRefreshToken(token).sub).toBe('user-123');
  });
});
