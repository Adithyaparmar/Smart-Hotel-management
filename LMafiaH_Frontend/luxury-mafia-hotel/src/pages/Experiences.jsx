import { ExperienceCard } from '../components/home/ExperiencesAndDining'
import SectionHeading from '../components/common/SectionHeading'
import { experiences } from '../data/experiences'

export default function Experiences() {
  return (
    <div className="pt-24">
      <section className="relative flex h-[52vh] min-h-[380px] items-end overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000&auto=format&fit=crop"
          alt="Dark rooftop lounge at night"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-obsidian/20" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-14 lg:px-10">
          <span className="eyebrow">Beyond The Room</span>
          <h1 className="display-lg mt-3">The Experience</h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <SectionHeading
          eyebrow="Curated By The House"
          title="Time, spent deliberately."
          description="Every experience is arranged privately, on your schedule, by a team that never needs to ask twice."
        />
        <div className="mt-14 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {experiences.map((e, i) => (
            <ExperienceCard key={e.id} item={e} index={i} />
          ))}
        </div>
      </section>
    </div>
  )
}
