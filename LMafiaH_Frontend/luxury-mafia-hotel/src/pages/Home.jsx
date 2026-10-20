import Hero from '../components/home/Hero'
import BookingWidget from '../components/home/BookingWidget'
import BrandStory from '../components/home/BrandStory'
import RoomShowcase from '../components/home/RoomShowcase'
import { ExperiencesSection, DiningSection } from '../components/home/ExperiencesAndDining'
import AIConciergePreview from '../components/home/AIConciergePreview'
import { Testimonials, LocationSection, Newsletter } from '../components/home/TestimonialsLocationNewsletter'

export default function Home() {
  return (
    <>
      <Hero />
      <BookingWidget />
      <BrandStory />
      <RoomShowcase />
      <ExperiencesSection />
      <DiningSection />
      <AIConciergePreview />
      <Testimonials />
      <LocationSection />
      <Newsletter />
    </>
  )
}
