# FastRead

RSVP speed reading for academic PDFs. Upload a PDF, extract text (with OCR for scanned documents), and read at configurable speeds.

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

| Change Type | Version Bump | Examples |
|-------------|--------------|----------|
| **MAJOR** (x.0.0) | Breaking changes | API changes, major rewrites, incompatible updates |
| **MINOR** (0.x.0) | New features | New functionality, backward-compatible additions |
| **PATCH** (0.0.x) | Bug fixes | Bug fixes, minor improvements, documentation |

**Every change must increment the version** in `package.json`. See `DEVLOG.md` for change history.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
