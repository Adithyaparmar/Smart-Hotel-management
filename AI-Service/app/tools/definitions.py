"""
Definitions of the controlled tools THE CONSIGLIERE may call. These are pure
descriptions (name + JSON schema) handed to the LLM's native tool-calling —
executing a tool is a completely separate step (`app/services/node_client.py`)
that goes through the Node backend, which re-authorizes every call. The LLM
only ever sees these schemas; it never gets a database connection or credentials.

`requires_confirmation=True` tools (createBooking, cancelBooking) are executed
by Node only when `params.confirmed` is true — see `concierge_agent.py` for how
the orchestrator surfaces a confirmation step to the user before setting that flag.
"""
from app.models.schemas import ToolDefinition

TOOLS: list[ToolDefinition] = [
    ToolDefinition(
        name="searchRooms",
        description="Search rooms, optionally filtered by dates (to also check availability), room type, and party size.",
        parameters={
            "type": "object",
            "properties": {
                "checkInDate": {"type": "string", "format": "date", "description": "YYYY-MM-DD"},
                "checkOutDate": {"type": "string", "format": "date", "description": "YYYY-MM-DD"},
                "adults": {"type": "integer", "minimum": 1, "default": 1},
                "children": {"type": "integer", "minimum": 0, "default": 0},
                "roomTypeId": {"type": "string"},
            },
        },
    ),
    ToolDefinition(
        name="checkAvailability",
        description="Check whether a specific room is available for a specific date range.",
        parameters={
            "type": "object",
            "properties": {
                "roomId": {"type": "string"},
                "checkInDate": {"type": "string", "format": "date"},
                "checkOutDate": {"type": "string", "format": "date"},
            },
            "required": ["roomId", "checkInDate", "checkOutDate"],
        },
    ),
    ToolDefinition(
        name="getRoomDetails",
        description="Get full details (description, amenities, images, recent reviews) for a specific room.",
        parameters={"type": "object", "properties": {"roomId": {"type": "string"}}, "required": ["roomId"]},
    ),
    ToolDefinition(
        name="calculateBookingPrice",
        description="Calculate the authoritative, server-computed price breakdown for a stay (nights, tax, service charge, discount, total). Always use this rather than estimating a price yourself.",
        parameters={
            "type": "object",
            "properties": {
                "roomId": {"type": "string"},
                "checkInDate": {"type": "string", "format": "date"},
                "checkOutDate": {"type": "string", "format": "date"},
                "discountCode": {"type": "string"},
            },
            "required": ["roomId", "checkInDate", "checkOutDate"],
        },
    ),
    ToolDefinition(
        name="getHotelInformation",
        description="Get general hotel information: name, check-in/out times, contact details.",
        parameters={"type": "object", "properties": {}},
    ),
    ToolDefinition(
        name="getHotelPolicies",
        description="Get the hotel's cancellation and stay policies.",
        parameters={"type": "object", "properties": {}},
    ),
    ToolDefinition(
        name="getUserBookings",
        description="List the current user's own bookings. Never use this to look up another guest's bookings.",
        parameters={
            "type": "object",
            "properties": {"status": {"type": "string", "enum": ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"]}},
        },
    ),
    ToolDefinition(
        name="getBookingStatus",
        description="Get the status of one of the current user's bookings by id.",
        parameters={"type": "object", "properties": {"bookingId": {"type": "string"}}, "required": ["bookingId"]},
    ),
    ToolDefinition(
        name="createBooking",
        description=(
            "Create a new booking for the current user. SENSITIVE ACTION: before calling this with "
            "confirmed=true, you must first present the room, dates and full price breakdown to the "
            "guest and receive their explicit confirmation in the conversation."
        ),
        parameters={
            "type": "object",
            "properties": {
                "roomId": {"type": "string"},
                "checkInDate": {"type": "string", "format": "date"},
                "checkOutDate": {"type": "string", "format": "date"},
                "numAdults": {"type": "integer", "minimum": 1, "default": 1},
                "numChildren": {"type": "integer", "minimum": 0, "default": 0},
                "specialRequests": {"type": "string"},
                "discountCode": {"type": "string"},
                "confirmed": {"type": "boolean", "description": "Set true only after the guest has explicitly confirmed the booking details and price."},
            },
            "required": ["roomId", "checkInDate", "checkOutDate"],
        },
        requires_confirmation=True,
    ),
    ToolDefinition(
        name="cancelBooking",
        description=(
            "Cancel one of the current user's bookings. SENSITIVE ACTION: confirm with the guest "
            "before calling this with confirmed=true, and let them know the cancellation policy result."
        ),
        parameters={
            "type": "object",
            "properties": {
                "bookingId": {"type": "string"},
                "reason": {"type": "string"},
                "confirmed": {"type": "boolean"},
            },
            "required": ["bookingId"],
        },
        requires_confirmation=True,
    ),
]

TOOLS_BY_NAME = {t.name: t for t in TOOLS}


def tools_as_llm_schema() -> list[dict]:
    """Shape expected by `app/services/llm_client.py` (name/description/parameters)."""
    return [{"name": t.name, "description": t.description, "parameters": t.parameters} for t in TOOLS]
