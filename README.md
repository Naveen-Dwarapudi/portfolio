# portfolio

Personal portfolio of Naveen Dwarapudi, a React.js and React Native engineer.

[![CI](https://github.com/Naveen-Dwarapudi/portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/Naveen-Dwarapudi/portfolio/actions/workflows/ci.yml)

Built with Next.js (App Router), TypeScript, and Tailwind CSS v4. Deployed on Vercel.

## Development

Requires Node 24 (`nvm use`).

    npm install
    cp .env.example .env.local   # optional; defaults to http://localhost:3000
    npm run dev

## Checks

| Command                             | What it runs                       |
| ----------------------------------- | ---------------------------------- |
| `npm run lint`                      | ESLint                             |
| `npm run format:check`              | Prettier                           |
| `npm run typecheck`                 | Route type generation + `tsc`      |
| `npm run test`                      | Vitest unit and component tests    |
| `npm run build && npm run test:e2e` | Playwright E2E + axe accessibility |
| `npm run build && npm run lhci`     | Lighthouse CI performance budget   |

Design: [docs/superpowers/specs/2026-09-19-nextjs-portfolio-design.md](docs/superpowers/specs/2026-09-19-nextjs-portfolio-design.md)
