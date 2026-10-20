# repositories/

Reserved for a data-access layer. In this codebase, most domains are simple
enough that `services/*.js` query Prisma directly — adding a repository
wrapper around every model would be indirection without benefit at this size.

Split a domain's queries out into `repositories/<domain>.repository.js` once
either becomes true:
- the same complex query (multi-table joins, raw SQL) is duplicated across
  more than one service, or
- you want to swap persistence for a given domain (e.g. move analytics reads
  to a read replica or a warehouse) without touching business logic.

`booking.service.js` and `analytics.service.js` are the most likely first
candidates if the app grows.
