/** Human-readable, sortable booking references: LMH-2026-000123 */
function generateBookingNumber(sequenceHint) {
  const year = new Date().getFullYear();
  const rand = sequenceHint ?? Math.floor(100000 + Math.random() * 900000);
  return `LMH-${year}-${String(rand).slice(-6)}`;
}

module.exports = { generateBookingNumber };
