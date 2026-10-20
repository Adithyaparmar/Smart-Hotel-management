/**
 * Test bootstrap. These tests exercise real business logic (pricing math,
 * password hashing, JWT signing, authorization decisions) directly against
 * the actual modules. Tests that need the database (booking creation,
 * double-booking prevention, check-in/out) use a real Prisma client against
 * TEST_DATABASE_URL / DATABASE_URL and are grouped so they can be skipped
 * in environments without Postgres — see README "Test commands".
 */
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_access_secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret';
process.env.DATABASE_URL = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL || 'postgresql://lmh_user:lmh_password@localhost:5432/luxury_mafia_hotel_test?schema=public';
