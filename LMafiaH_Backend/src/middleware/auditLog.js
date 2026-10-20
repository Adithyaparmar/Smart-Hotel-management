const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Fire-and-forget audit trail for sensitive actions (role changes, payment
 * overrides, cancellations by staff, hotel setting edits, AI-triggered
 * bookings, etc). Never throws — an audit log failure must not break the
 * primary request.
 */
async function recordAudit({ actorUserId, action, entityType, entityId, metadata, ipAddress }) {
  try {
    await prisma.auditLog.create({
      data: { actorUserId, action, entityType, entityId, metadata, ipAddress },
    });
  } catch (err) {
    logger.warn(`Audit log write failed: ${err.message}`);
  }
}

module.exports = { recordAudit };
