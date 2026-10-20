const argon2 = require('argon2');

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // ~19 MB, OWASP recommended minimum for argon2id
  timeCost: 2,
  parallelism: 1,
};

async function hashPassword(plainPassword) {
  return argon2.hash(plainPassword, ARGON2_OPTIONS);
}

async function verifyPassword(hash, plainPassword) {
  try {
    return await argon2.verify(hash, plainPassword);
  } catch (err) {
    return false;
  }
}

module.exports = { hashPassword, verifyPassword };
