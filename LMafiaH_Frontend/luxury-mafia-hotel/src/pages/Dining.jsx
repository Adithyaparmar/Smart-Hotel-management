import { DiningCard } from '../components/home/ExperiencesAndDining'
import SectionHeading from '../components/common/SectionHeading'
import { diningVenues } from '../data/experiences'

export default function Dining() {
  return (
    <div className="pt-24">
      <section className="relative flex h-[52vh] min-h-[380px] items-end overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2000&auto=format&fit=crop"
          alt="Candlelit fine dining table"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-obsidian/20" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-14 lg:px-10">
          <span className="eyebrow">Table &amp; Cellar</span>
          <h1 className="display-lg mt-3">Dining, kept private.</h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <SectionHeading
          eyebrow="Culinary Direction"
          title="Recipes older than the hotel itself."
          description="A single kitchen serves five very different rooms, each with its own hour, mood, and menu."
        />
        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {diningVenues.map((v, i) => (
            <DiningCard key={v.id} venue={v} index={i} />
          ))}
        </div>
      </section>
    </div>
  )
}
