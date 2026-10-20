/**
 * Controlled tool surface for THE CONSIGLIERE (AI Concierge).
 *
 * Room-related AI tools accept either a real PostgreSQL room UUID or a
 * human-friendly room reference such as "The Don", "the-don", or a room
 * number. The backend resolves the reference to the canonical UUID before
 * touching booking/availability/pricing services.
 */
const AppError = require('../utils/AppError');
const roomService = require('./room.service');
const availabilityService = require('./availability.service');
const pricingService = require('./pricing.service');
const bookingService = require('./booking.service');
const settingsService = require('./hotelSetting.service');
const prisma = require('../config/database');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function canonicalizeRoomReference(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/\b(room|suite|residence|estate|penthouse|villa)\b/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

/**
 * Resolve a room reference supplied by the LLM to the canonical DB UUID.
 * Accepted forms:
 *   - PostgreSQL UUID
 *   - room name: "The Don"
 *   - slug: "the-don"
 *   - room number: "1201"
 *   - natural variants: "The Don room", "Don suite"
 */
async function resolveRoomId(value) {
  if (!value) {
    throw AppError.badRequest('A room reference is required', 'ROOM_REFERENCE_MISSING');
  }

  const raw = String(value).trim();
  if (UUID_RE.test(raw)) return raw;

  const canonical = canonicalizeRoomReference(raw);
  if (!canonical) {
    throw AppError.badRequest('Invalid room reference', 'INVALID_ROOM_REFERENCE');
  }

  const rooms = await prisma.room.findMany({
    where: { isActive: true },
    select: {
      id: true,
      roomNumber: true,
      name: true,
      roomType: { select: { name: true } },
    },
    orderBy: { roomNumber: 'asc' },
  });

  const exact = rooms.find((room) => (
    canonicalizeRoomReference(room.name) === canonical
    || canonicalizeRoomReference(room.roomNumber) === canonical
    || canonicalizeRoomReference(room.roomType?.name) === canonical
  ));

  if (exact) return exact.id;

  // Useful for short/natural references such as "Don" or "black label".
  const partialMatches = rooms.filter((room) => {
    const names = [room.name, room.roomNumber, room.roomType?.name]
      .filter(Boolean)
      .map(canonicalizeRoomReference);
    return names.some((candidate) => candidate.includes(canonical) || canonical.includes(candidate));
  });

  if (partialMatches.length === 1) return partialMatches[0].id;

  throw AppError.notFound(`Room not found: ${raw}`, 'ROOM_NOT_FOUND');
}

function readRoomReference(params) {
  return params?.roomId ?? params?.room ?? params?.roomName ?? params?.name ?? params?.slug;
}

async function resolveRoomTypeId(value) {
  if (!value) return undefined;
  if (UUID_RE.test(String(value).trim())) return String(value).trim();

  const canonical = canonicalizeRoomReference(value);
  if (!canonical) return undefined;

  const types = await prisma.roomType.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  const match = types.find((type) => canonicalizeRoomReference(type.name) === canonical)
    || types.find((type) => {
      const candidate = canonicalizeRoomReference(type.name);
      return candidate.includes(canonical) || canonical.includes(candidate);
    });

  return match?.id;
}

async function searchRooms(params = {}) {
  let { checkInDate, checkOutDate, adults = 1, children = 0, roomTypeId } = params;
  roomTypeId = await resolveRoomTypeId(roomTypeId);

  if (checkInDate && checkOutDate) {
    return availabilityService.findAvailableRooms({
      checkInDate: new Date(checkInDate),
      checkOutDate: new Date(checkOutDate),
      adults,
      children,
      roomTypeId,
    });
  }

  const result = await roomService.listRooms({
    page: 1,
    limit: 10,
    sortBy: 'price',
    sortOrder: 'asc',
    roomTypeId,
    isActive: true,
  });
  return result.items;
}

async function checkAvailability(params) {
  const roomId = await resolveRoomId(readRoomReference(params));
  const booked = await availabilityService.isRoomBooked(
    roomId,
    new Date(params.checkInDate),
    new Date(params.checkOutDate),
  );
  return { roomId, available: !booked };
}

async function getRoomDetails(params) {
  const roomId = await resolveRoomId(readRoomReference(params));
  return roomService.getRoom(roomId);
}

async function calculateBookingPriceTool(params) {
  const roomId = await resolveRoomId(readRoomReference(params));
  const { checkInDate, checkOutDate, discountCode } = params;
  return pricingService.calculateBookingPrice({
    roomId,
    checkInDate: new Date(checkInDate),
    checkOutDate: new Date(checkOutDate),
    discountCode,
  });
}

async function getHotelInformation() {
  const settings = await settingsService.listSettings();
  return {
    name: settings.hotelName,
    checkInTime: settings.checkInTime,
    checkOutTime: settings.checkOutTime,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
  };
}

async function getHotelPolicies() {
  const settings = await settingsService.listSettings();
  return {
    cancellationWindowHours: settings.cancellationWindowHours,
    checkInTime: settings.checkInTime,
    checkOutTime: settings.checkOutTime,
    note: 'Cancellations made after the free window are subject to a partial charge. See /api/hotel/policies for full text.',
  };
}

async function getUserBookings(params, authContext) {
  if (!authContext?.userId) throw AppError.unauthorized('AI tool call missing user context', 'AI_AUTH_CONTEXT_MISSING');
  const result = await bookingService.listMyBookings(authContext.userId, { page: 1, limit: 10, status: params?.status });
  return result.items;
}

async function getBookingStatus(params, authContext) {
  if (!authContext?.userId) throw AppError.unauthorized('AI tool call missing user context', 'AI_AUTH_CONTEXT_MISSING');
  const booking = await bookingService.getBookingById(params.bookingId, { id: authContext.userId, role: authContext.role });
  return {
    bookingNumber: booking.bookingNumber,
    status: booking.status,
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate,
    totalAmount: booking.totalAmount,
  };
}

/** Sensitive — requires prior user confirmation surfaced by the AI orchestrator. */
async function createBookingTool(params, authContext) {
  if (!authContext?.userId) throw AppError.unauthorized('AI tool call missing user context', 'AI_AUTH_CONTEXT_MISSING');
  if (authContext.role !== 'CUSTOMER') {
    throw AppError.forbidden('Only a customer can create a booking through the concierge', 'FORBIDDEN_ROLE');
  }

  const roomId = await resolveRoomId(readRoomReference(params));
  return bookingService.createBooking(authContext.userId, {
    roomId,
    checkInDate: new Date(params.checkInDate),
    checkOutDate: new Date(params.checkOutDate),
    numAdults: params.numAdults || 1,
    numChildren: params.numChildren || 0,
    specialRequests: params.specialRequests,
    guests: params.guests || [],
    discountCode: params.discountCode,
  });
}

/** Sensitive — requires prior user confirmation surfaced by the AI orchestrator. */
async function cancelBookingTool(params, authContext) {
  if (!authContext?.userId) throw AppError.unauthorized('AI tool call missing user context', 'AI_AUTH_CONTEXT_MISSING');
  return bookingService.cancelBooking(params.bookingId, { id: authContext.userId, role: authContext.role }, params.reason);
}

const TOOL_REGISTRY = {
  searchRooms: { handler: searchRooms, requiresConfirmation: false },
  checkAvailability: { handler: checkAvailability, requiresConfirmation: false },
  getRoomDetails: { handler: getRoomDetails, requiresConfirmation: false },
  calculateBookingPrice: { handler: calculateBookingPriceTool, requiresConfirmation: false },
  getHotelInformation: { handler: getHotelInformation, requiresConfirmation: false },
  getHotelPolicies: { handler: getHotelPolicies, requiresConfirmation: false },
  getUserBookings: { handler: getUserBookings, requiresConfirmation: false },
  getBookingStatus: { handler: getBookingStatus, requiresConfirmation: false },
  createBooking: { handler: createBookingTool, requiresConfirmation: true },
  cancelBooking: { handler: cancelBookingTool, requiresConfirmation: true },
};

async function executeTool(toolName, params, authContext) {
  const entry = TOOL_REGISTRY[toolName];
  if (!entry) throw AppError.badRequest(`Unknown AI tool: ${toolName}`, 'UNKNOWN_AI_TOOL');

  if (entry.requiresConfirmation && !params?.confirmed) {
    return { requiresConfirmation: true, toolName, params };
  }

  const result = await entry.handler(params, authContext);
  return { requiresConfirmation: false, toolName, result };
}

// --- AI memory (non-sensitive preferences only) -----------------------

const ALLOWED_MEMORY_CATEGORIES = ['ROOM_PREFERENCE', 'VIEW_PREFERENCE', 'HOSPITALITY_PREFERENCE', 'CONVERSATION_CONTEXT', 'OTHER'];

async function getUserMemories(userId) {
  return prisma.aIMemory.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });
}

async function upsertUserMemory(userId, { key, value, category }) {
  if (category && !ALLOWED_MEMORY_CATEGORIES.includes(category)) {
    throw AppError.badRequest('Invalid memory category', 'INVALID_MEMORY_CATEGORY');
  }
  return prisma.aIMemory.upsert({
    where: { userId_key: { userId, key } },
    update: { value, category: category || 'OTHER' },
    create: { userId, key, value, category: category || 'OTHER' },
  });
}

async function deleteUserMemory(userId, key) {
  await prisma.aIMemory.deleteMany({ where: { userId, key } });
}

module.exports = {
  TOOL_REGISTRY,
  executeTool,
  getUserMemories,
  upsertUserMemory,
  deleteUserMemory,
};
