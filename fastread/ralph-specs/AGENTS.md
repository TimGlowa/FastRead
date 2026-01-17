# FastRead - Project Commands

## Build & Development

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start
```

## Code Quality

```bash
# Run all checks (use before committing)
npm run type-check && npm run lint && npm run test

# Individual checks
npm run type-check    # TypeScript type checking
npm run lint          # ESLint
npm run lint:fix      # ESLint with auto-fix
npm run format        # Prettier format
npm run format:check  # Prettier check
```

## Testing

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e
```

## Project Structure

```
src/
  app/           # Next.js App Router pages
  lib/           # Shared utilities
    text-processor/  # Tokenizer for RSVP
    supabase/        # Database client
    pwa/             # Service worker registration
  types/         # TypeScript type definitions
```

## Tech Stack

- Next.js 16 with App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- Supabase (auth + database)
- Vitest for unit tests
- Playwright for e2e tests
- pdfjs-dist for PDF parsing
- Zustand for state management
