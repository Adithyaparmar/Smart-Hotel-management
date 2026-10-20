"""
Seed knowledge base for the RAG pipeline: hotel policies, check-in/out rules,
amenities, dining, facilities, FAQs. In production these would be authored in a
CMS/admin panel and re-ingested on change; for now they're plain source
documents that `ingest.py` chunks and embeds into the vector store.

Each entry becomes one or more chunks; `source` is surfaced back to the LLM (and
can be shown to the user) so answers are traceable to a policy document.
"""

KNOWLEDGE_DOCUMENTS = [
    {
        "source": "cancellation_policy",
        "title": "Cancellation Policy",
        "text": (
            "Guests may cancel a confirmed reservation free of charge up to 24 hours "
            "before the scheduled check-in date. Cancellations made within 24 hours of "
            "check-in are eligible for a 50% refund of the total booking amount. "
            "No-shows forfeit the full reservation amount. Refunds are processed to the "
            "original payment method within 5-7 business days."
        ),
    },
    {
        "source": "checkin_checkout_rules",
        "title": "Check-in & Check-out",
        "text": (
            "Standard check-in time is 2:00 PM local time; standard check-out is "
            "11:00 AM. Early check-in and late check-out are subject to room "
            "availability and may incur an additional charge. Guests must present a "
            "valid government-issued photo ID at check-in. All registered guests "
            "must be listed on the booking."
        ),
    },
    {
        "source": "amenities_overview",
        "title": "Amenities",
        "text": (
            "Luxury Mafia Hotel offers a rooftop pool, a full-service spa and "
            "wellness centre, a cigar lounge, a private dining room available for "
            "reservation, 24/7 concierge service, valet parking, and a dedicated "
            "business suite with meeting rooms. Select suites include a private "
            "terrace, marble bathroom, in-room espresso bar, and a walk-in wardrobe."
        ),
    },
    {
        "source": "dining_overview",
        "title": "Dining",
        "text": (
            "The hotel's signature restaurant serves modern Italian cuisine for "
            "breakfast, lunch and dinner. In-room dining is available 24 hours. The "
            "cigar lounge serves a curated selection of spirits and cigars each "
            "evening from 6 PM. The private dining room can be reserved for groups "
            "of up to 12 guests with advance notice through the concierge."
        ),
    },
    {
        "source": "facilities_overview",
        "title": "Facilities",
        "text": (
            "Facilities include a fitness centre open 24 hours, a rooftop pool open "
            "6 AM to 10 PM, valet and self parking, a business centre with printing "
            "and meeting rooms, and on-site currency exchange. Wi-Fi is complimentary "
            "throughout the property."
        ),
    },
    {
        "source": "faq_pets",
        "title": "FAQ — Pets",
        "text": (
            "Well-behaved pets under 25 lbs are welcome in designated pet-friendly "
            "rooms for an additional nightly fee. Please notify the concierge at the "
            "time of booking so a suitable room can be arranged."
        ),
    },
    {
        "source": "faq_extra_guests",
        "title": "FAQ — Extra Guests & Children",
        "text": (
            "Each room type has a maximum occupancy for adults and children shown on "
            "its listing; bookings cannot exceed this without upgrading to a larger "
            "room type. Children under 12 stay free when using existing bedding."
        ),
    },
    {
        "source": "faq_payment",
        "title": "FAQ — Payment",
        "text": (
            "Full payment is collected at the time of booking via Razorpay, "
            "supporting major cards, UPI and net banking. A booking is only "
            "confirmed once payment has been verified; unpaid holds are "
            "automatically released after 20 minutes."
        ),
    },
]
