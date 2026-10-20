const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const suitePresentation = {
  'The Don': {
    id: 'the-don',
    tagline: 'The house at its most absolute.',
    size: '210 m²',
    beds: '1 King, 1 Queen',
    view: 'Panoramic City & Terrace',
  },
  'The Capo': {
    id: 'the-capo',
    tagline: 'Command, without raising your voice.',
    size: '96 m²',
    beds: '1 King',
    view: 'Skyline',
  },
  'The Consigliere': {
    id: 'the-consigliere',
    tagline: 'Quiet counsel, exceptional comfort.',
    size: '58 m²',
    beds: '1 King',
    view: 'Courtyard',
  },
  'The Underboss': {
    id: 'the-underboss',
    tagline: 'Second in size. First in comfort.',
    size: '74 m²',
    beds: '1 King, 1 Sofa Bed',
    view: 'City',
  },
  'The Family Estate': {
    id: 'the-family-estate',
    tagline: 'Room enough for the whole table.',
    size: '138 m²',
    beds: '2 King, 1 Sofa Bed',
    view: 'Garden Courtyard',
  },
  'The Black Label': {
    id: 'the-black-label',
    tagline: 'The only one of its kind.',
    size: '340 m²',
    beds: '2 King, 1 Queen',
    view: 'Rooftop Pool & Full Skyline',
  },
}

async function request(path) {
  const response = await fetch(`${API_BASE_URL}${path}`)

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new Error('The hotel service returned an invalid response.')
  }

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'Unable to load hotel rooms.')
  }

  return payload.data
}

function adaptRoom(room) {
  const presentation = suitePresentation[room.name]

  if (!presentation) {
    throw new Error(`Unknown suite received from backend: ${room.name}`)
  }

  const price = Number(room.price ?? room.roomType?.basePrice ?? 0)
  const amenities = Array.isArray(room.amenities)
    ? room.amenities
        .map((item) => item?.amenity?.name)
        .filter(Boolean)
    : []

  return {
    id: presentation.id,
    backendId: room.id,
    roomNumber: room.roomNumber,
    name: room.name,
    category: room.roomType?.name || '',
    tagline: presentation.tagline,
    description: room.description,
    size: presentation.size,
    capacity: Number(room.capacityAdults || 0),
    beds: presentation.beds,
    view: presentation.view,
    price,
    currency: '₹',
    images: room.images || room.roomType?.images || [],
    amenities,
    status: room.status,
    isActive: room.isActive,
  }
}

async function fetchActiveRooms() {
  const rooms = await request('/rooms?isActive=true')
  return rooms.map(adaptRoom)
}

export const roomService = {
  async list({
  roomType,
  sort,
  checkInDate,
  checkOutDate,
  adults = 1,
  children = 0,
} = {}) {
  let result = await fetchActiveRooms()

  if (checkInDate && checkOutDate) {
    const params = new URLSearchParams({
      checkInDate,
      checkOutDate,
      adults: String(adults),
      children: String(children),
    })

    const availableRooms = await request(`/rooms/availability?${params.toString()}`)
    const availableIds = new Set(
      Array.isArray(availableRooms)
        ? availableRooms.map((room) => room.id)
        : []
    )

    result = result.filter((room) => availableIds.has(room.backendId))
  }

  if (roomType && roomType !== 'Any Room Type') {
    result = result.filter((room) => room.category === roomType)
  }

  if (sort === 'price-asc') {
    result.sort((a, b) => a.price - b.price)
  }

  if (sort === 'price-desc') {
    result.sort((a, b) => b.price - a.price)
  }

  return result
},

  async getById(id) {
    const rooms = await fetchActiveRooms()
    const room = rooms.find((item) => item.id === id)

    if (!room) {
      throw new Error('Suite not found.')
    }

    return room
  },

  async checkAvailability(id, checkInDate, checkOutDate, adults = 1, children = 0) {
  const rooms = await fetchActiveRooms()
  const room = rooms.find((item) => item.id === id)

  if (!room) {
    throw new Error('Suite not found.')
  }

  const params = new URLSearchParams({
    checkInDate,
    checkOutDate,
    adults: String(adults),
    children: String(children),
  })

  const availableRooms = await request(`/rooms/availability?${params.toString()}`)

  const available = Array.isArray(availableRooms)
    ? availableRooms.some((item) => item.id === room.backendId)
    : false

    return { available }
  },
}