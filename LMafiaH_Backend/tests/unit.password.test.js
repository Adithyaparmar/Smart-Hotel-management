const { hashPassword, verifyPassword } = require('../src/utils/password');

describe('password hashing (argon2id)', () => {
  test('hashes a password and verifies the correct plaintext', async () => {
    const hash = await hashPassword('Correct#Horse1');
    expect(hash).not.toBe('Correct#Horse1');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    await expect(verifyPassword(hash, 'Correct#Horse1')).resolves.toBe(true);
  });

  test('rejects an incorrect plaintext', async () => {
    const hash = await hashPassword('Correct#Horse1');
    await expect(verifyPassword(hash, 'wrong-password')).resolves.toBe(false);
  });

  test('never produces the same hash twice for the same input (unique salt)', async () => {
    const a = await hashPassword('SamePassword1!');
    const b = await hashPassword('SamePassword1!');
    expect(a).not.toBe(b);
  });
});
