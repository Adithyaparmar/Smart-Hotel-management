const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const recommendationIds = {
  'The Don': 'the-don',
  'The Capo': 'the-capo',
  'The Consigliere': 'the-consigliere',
  'The Underboss': 'the-underboss',
  'The Family Estate': 'the-family-estate',
  'The Black Label': 'the-black-label',
}

function getAccessToken() {
  return localStorage.getItem('accessToken') || localStorage.getItem('access_token') || ''
}

async function postChat({ conversationId, message }) {
  const token = getAccessToken()
  if (!token) {
    const error = new Error('Please sign in before using The Consigliere.')
    error.code = 'AUTH_REQUIRED'
    throw error
  }

  const response = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...(conversationId ? { conversationId } : {}),
      message: message.trim(),
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.message || 'The Consigliere is unavailable right now.')
    error.code = payload.code
    error.status = response.status
    throw error
  }

  return payload.data ?? payload
}

function extractRecommendations(toolCalls = []) {
  const searchCall = [...toolCalls].reverse().find((call) => call?.toolName === 'searchRooms')
  const raw = searchCall?.result?.result ?? searchCall?.result
  if (!Array.isArray(raw)) return []

  return raw
    .map((room) => recommendationIds[room?.name])
    .filter(Boolean)
    .slice(0, 2)
}

function buildToolStatus(toolCalls = []) {
  if (!toolCalls.length) return ''
  const latest = toolCalls[toolCalls.length - 1]
  if (latest.toolName === 'searchRooms') return 'Searching suites and availability'
  if (latest.toolName === 'checkAvailability') return 'Checking suite availability'
  if (latest.toolName === 'calculateBookingPrice') return 'Calculating your stay price'
  if (latest.toolName === 'getRoomDetails') return 'Reviewing suite details'
  if (latest.toolName === 'getUserBookings') return 'Reviewing your bookings'
  if (latest.toolName === 'getBookingStatus') return 'Checking booking status'
  return `Using ${latest.toolName}`
}

export const aiService = {
  async sendMessage(query, conversationId = null) {
    const data = await postChat({ conversationId, message: query })
    return {
      ...data,
      toolStatus: buildToolStatus(data.toolCalls),
      recommendations: extractRecommendations(data.toolCalls),
    }
  },
}
