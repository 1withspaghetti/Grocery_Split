# Grocery Split

Grocery Split is a web application for roommates to coordinate grocery shopping and split costs fairly, including the cost of shared bulk items.

## About

Roommates often need a better way to coordinate grocery purchases, plan shopping trips, and work out who owes what. Grocery Split brings shared grocery tracking and expense splitting together so groups can plan purchases and see each person's share.

### Features

- Track groceries shared by a roommate group including cost, amount, and requesters.
- Organize groceries into trips, with a shopping list for each trip.
- Review group IOUs and see how grocery costs are split, including bulk items.

These describe the product goals; the frontend and API are not yet connected.

## Project Structure

- `packages/react-frontend`: React with Vite SPA PWA
- `packages/api`: Hono API using Cloudflare Workers
- `packages/db`: Drizzle schema and Cloudflare D1 migrations
- `packages/validation`: Shared TypeScript types and Zod schemas

## Getting Started

Requirements: Node.js 22 or newer and pnpm 11.22.0. The root package configuration pins pnpm.

Install dependencies from the repository root:

```bash
pnpm install
```

To update an existing checkout, run these commands from the repository root:

```bash
git pull
pnpm install
```

In order to prepare the database for local development for the first time (or after any database changes, see [`packages/db/README.md`](packages/db/README.md)):

```bash
pnpm --filter @grocery-split/db db:migrate
pnpm --filter @grocery-split/db db:seed
```

### Run Locally

There is no root `start` or `dev` command. Start the frontend and API separately, each in its own terminal from the repository root:

```bash
pnpm --filter @grocery-split/react-frontend dev
```

```bash
pnpm --filter @grocery-split/api dev
```

Open the URL printed by Vite (usually [http://localhost:5173](http://localhost:5173)) to view the frontend. The API runs separately through Wrangler on a different port.

## Tests

Automated tests are not configured yet. No test command is currently available.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for contribution guidelines.

## TE6: Access Control

We use Better Auth with Google sign-in instead of passwords. The session token is kept in an httpOnly cookie and sent with every API call.

### Sign Up
![Sign Up](TE6/TE6-SignUp-Flow.png)

### Sign In
![Sign In](TE6/TE6-SignIn-Flow.png)

### Protected Request
![Protected Request](TE6/TE6-Protected-Request.png)
