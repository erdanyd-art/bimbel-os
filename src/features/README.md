# Features

This folder holds one directory per business capability, matching the Core/Supporting Domain entities in [docs/DOMAIN_MODEL.md](../../docs/DOMAIN_MODEL.md) — e.g. `enrollment/`, `attendance/`, `payments/`, `scheduling/`.

## Convention

Each feature folder is self-contained and may include:

```
features/<feature-name>/
├── components/   # Server Components by default; "use client" only where interactivity is required
├── actions/      # Server Actions (mutations)
├── queries/      # data-fetching functions
└── types.ts      # feature-local types
```

`src/app/` stays thin — routes import from `features/*` rather than containing business logic directly.

This folder is intentionally empty for now. No feature has been implemented yet.
