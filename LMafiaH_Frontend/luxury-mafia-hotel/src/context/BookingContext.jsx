import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const BookingContext = createContext(null)

const defaultSearch = {
  checkIn: '',
  checkOut: '',
  guests: 2,
  roomType: 'Any Room Type',
}

export function BookingProvider({ children }) {
  const [search, setSearch] = useState(defaultSearch)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [guestDetails, setGuestDetails] = useState({ fullName: '', email: '', phone: '', guests: 2 })
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [confirmation, setConfirmation] = useState(null)

  const updateSearch = useCallback((partial) => {
    setSearch((prev) => ({ ...prev, ...partial }))
  }, [])

  const nights = useMemo(() => {
    if (!search.checkIn || !search.checkOut) return 3
    const inDate = new Date(search.checkIn)
    const outDate = new Date(search.checkOut)
    const diff = Math.round((outDate - inDate) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 3
  }, [search.checkIn, search.checkOut])

  const reset = useCallback(() => {
    setSearch(defaultSearch)
    setSelectedRoom(null)
    setGuestDetails({ fullName: '', email: '', phone: '', guests: 2 })
    setPaymentMethod('card')
    setConfirmation(null)
  }, [])

  const value = {
    search,
    updateSearch,
    selectedRoom,
    setSelectedRoom,
    guestDetails,
    setGuestDetails,
    paymentMethod,
    setPaymentMethod,
    nights,
    confirmation,
    setConfirmation,
    reset,
  }

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used within BookingProvider')
  return ctx
}
