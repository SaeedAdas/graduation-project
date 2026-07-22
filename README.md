# Graduation Project Backend API

REST API for the graduation project, built with Node.js, Express, Prisma, and PostgreSQL. It provides session-based authentication, session-bound CSRF protection, role- and ownership-based authorization, validation, Swagger/OpenAPI documentation, and CRUD operations for users, posts, comments, reports, reactions, and categories.

## Contents

- [Technology stack](#technology-stack)
- [Features](#features)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Authentication and CSRF](#authentication-and-csrf)
- [API routes](#api-routes)
- [Query parameters](#query-parameters)
- [Authorization](#authorization)
- [npm scripts](#npm-scripts)
- [Deployment notes](#deployment-notes)
- [Current implementation notes](#current-implementation-notes)

## Technology stack

| Area | Technology |
| --- | --- |
| Runtime | Node.js 18 or newer, CommonJS modules |
| HTTP framework | Express 4 |
| Database | PostgreSQL |
| ORM and schema | Prisma 6.19 |
| Sessions | `express-session`, `connect-pg-simple`, and PostgreSQL |
| Validation | Zod 4 |
| Authentication | Server-side sessions and `bcryptjs` password hashing |
| Authorization | Local policy engine with roles and resource ownership checks |
| CSRF protection | Custom session-bound token using Node's `crypto` module |
| API documentation | OpenAPI 3, `swagger-jsdoc`, and Swagger UI |
| Database queries | Prisma Client plus parameterized raw SQL for post feeds and statistics |
| Other HTTP concerns | CORS and JSON request parsing |

`@upstash/redis`, `csrf-csrf`, `cookie-parser`, and `dotenv` are installed dependencies, but they are not part of the active Express request pipeline. See [Current implementation notes](#current-implementation-notes).

## Features

- User registration, login, logout, private profiles, and public profiles.
- Administrative user creation, listing, updating, disabling, and deletion.
- Posts organized by category, with filtering, search, pagination, and aggregate statistics.
- Paginated post details with comments, ratings, reaction/report counts, and viewer-specific state.
- Comments with optional ratings from 0 to 5.
- One reaction and one report per user/post pair, enforced by database constraints.
- Category management and post counts per category.
- PostgreSQL-backed sessions with a seven-day absolute lifetime.
- Zod validation for bodies, URL parameters, and query parameters.
- Admin-only interactive Swagger documentation.

## Architecture

Requests flow through the router and its middleware before reaching controllers and the database:

```text
HTTP request
  -> global CORS / JSON / session / CSRF middleware
  -> route-specific authentication and validation
  -> optional resource loader
  -> policy authorization
  -> controller
  -> repository or Prisma Client
  -> PostgreSQL
```

```text
.
|-- config/
|   |-- connection.js       # Shared Prisma Client
|   |-- redis.js            # Upstash client scaffold
|   `-- swagger.js          # OpenAPI schemas and Swagger UI options
|-- controllers/            # HTTP handlers and OpenAPI route annotations
|-- helper/                 # Response helpers and Prisma error mapping
|-- middlewares/            # Authentication, CSRF, validation, loaders, policies
|-- permissions/
|   |-- policies.js         # Admin/User permissions and ownership rules
|   `-- policyEngine.js     # Policy lookup and evaluation
|-- prisma/
|   `-- schema.prisma       # PostgreSQL schema
|-- repositories/
|   `-- postRepository.js   # Feed/detail queries and aggregate statistics
|-- validations/            # Zod schemas
|-- router.js               # Route definitions and middleware chains
|-- server.js               # Express and session configuration
`-- package.json
```

## Getting started

### Prerequisites

- Node.js 18 or newer
- npm
- A PostgreSQL database

### Install and run locally

1. Install the dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file using the values in [Environment variables](#environment-variables). Do not commit this file. The current `.gitignore` does not exclude `.env`, so add it to a local/global Git ignore before storing secrets there.

3. Create/synchronize the application tables, including the `session` table:

   ```bash
   npm run db:push
   ```

4. Start the API while preloading the installed `dotenv` package:

   ```bash
   node -r dotenv/config server.js
   ```

The default local URL is `http://localhost:5000`.

`npm start` runs `node server.js`. Use it when the environment variables are already provided by your shell or hosting platform. The application does not currently call `dotenv.config()` itself.

## Environment variables

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
SESSION_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
PORT=5000
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Used by Prisma and the PostgreSQL session pool. |
| `SESSION_SECRET` | Yes | Signs the Express session ID cookie. |
| `FRONTEND_URL` | Yes | Exact origin allowed by CORS; credentials are enabled. |
| `NODE_ENV` | Recommended | In `production`, database SSL and secure session cookies are enabled. |
| `PORT` | No | HTTP port; defaults to `5000`. |
| `REDIS_URL` | No | Only needed if the unregistered Upstash rate limiter is activated. |
| `REDIS_TOKEN` | No | Only needed if the unregistered Upstash rate limiter is activated. |

## Database

Prisma reads `DATABASE_URL` from the environment. The current repository contains a schema but no migration history, so local setup uses `prisma db push` through `npm run db:push`.

| Model | Purpose and important relationships |
| --- | --- |
| `User` | Unique email and optional phone; `Admin` or `User`; `Active` or `Inactive`; owns posts, comments, reports, and reactions. |
| `Post` | Belongs to a user and category; owns comments, reports, and reactions. |
| `Comment` | Belongs to a user and post; can include a numeric rating. |
| `Report` | Belongs to a user and post; unique on `(userId, postId)`. |
| `Reaction` | Belongs to a user and post; unique on `(userId, postId)`. |
| `Category` | Has a unique name and many posts. Category deletion is restricted while posts reference it. |
| `Session` | Stores `connect-pg-simple` session JSON and expiration timestamps. |

Deleting a user or post cascades to its dependent records. The session store is configured with `createTableIfMissing: false`, so the `session` table must exist before the server handles sessions; `npm run db:push` creates it from the Prisma schema.

## Database Design

You can view the database schema here:

[View the ERD diagram on DrawSQL](https://drawsql.app/teams/saeeda/diagrams/graduation-project)

## Authentication and CSRF

Authentication is stored server-side in PostgreSQL. The browser receives an HTTP-only `sid` cookie. In production the cookie is marked `Secure`; `SameSite` is `lax`. The persistent lifetime is seven days, while a login with `rememberMe: false` changes it to a browser-session cookie.

Every unsafe method (`POST`, `PUT`, `PATCH`, and `DELETE`) is protected globally, including registration and login:

1. Send `GET /csrf-token` with credentials enabled. This creates a session if needed and returns `{ "csrfToken": "..." }`.
2. Send the token in the `x-csrf-token` header on the unsafe request, using the same `sid` cookie.
3. A successful login regenerates the session and returns a newly rotated CSRF token. Use that returned token for later unsafe requests.
4. Continue sending cookies by using `credentials: "include"` in browser requests.

Example login flow:

```js
const tokenResponse = await fetch("http://localhost:5000/csrf-token", {
  credentials: "include",
});
const { csrfToken } = await tokenResponse.json();

const loginResponse = await fetch("http://localhost:5000/auth/login", {
  method: "POST",
  credentials: "include",
  headers: {
    "content-type": "application/json",
    "x-csrf-token": csrfToken,
  },
  body: JSON.stringify({
    email: "user@example.com",
    password: "Example!123",
    rememberMe: true,
  }),
});

const { csrfToken: authenticatedCsrfToken } = await loginResponse.json();
```

Inactive users are rejected during login. For authenticated requests, the user is reloaded from PostgreSQL so deleted accounts and role changes take effect without waiting for the session to expire.

## API routes

Express mounts the routes below at `/`. All unsafe routes also require the CSRF header described above.

### Health, CSRF, and documentation

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/keep-alive` | Public | Health/keep-alive response. |
| `GET` | `/csrf-token` | Public | Create or reuse a session CSRF token. |
| `GET` | `/api-docs` | Admin | Swagger UI and its assets. |

### Authentication and users

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | Public | Log in and rotate the CSRF token. |
| `POST` | `/user/register` | Public | Register a user with the default `User` role. |
| `POST` | `/auth/logout` | Authenticated | Destroy the session and clear the `sid` cookie. |
| `GET` | `/user/profile` | Authenticated | Return the current user's private profile. |
| `PUT` | `/user/profile` | Authenticated | Replace the current user's profile fields. |
| `GET` | `/user/profile/:id` | Authenticated | Return another user's public profile. |
| `GET` | `/user/posts` | Authenticated | List the current user's posts. |
| `GET` | `/users` | Admin | List all users. |
| `POST` | `/user` | Admin | Create a managed user. |
| `PUT` | `/user/:id` | Admin | Update a managed user; user ID `1` is protected. |
| `DELETE` | `/user/:id` | Admin | Delete a managed user; user ID `1` is protected. |

### Posts

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/post` | Authenticated | Create a post. |
| `GET` | `/posts` | Authenticated | List posts with filters, viewer state, and statistics. |
| `GET` | `/post/:id/details` | Authenticated | Return a post and its comments/statistics. |
| `GET` | `/post/:id` | Authenticated | Return the raw post record. |
| `GET` | `/posts/user/:id` | Authenticated | List a selected user's posts. |
| `PUT` | `/post/:id` | Owner or Admin | Update a post. |
| `DELETE` | `/post/:id` | Owner or Admin | Delete a post. |

### Comments, reports, and reactions

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/comment/:post_id` | Authenticated | Add a comment to a post. |
| `GET` | `/comment/:id` | Authenticated | Return a comment. |
| `PUT` | `/comment/:id` | Owner or Admin | Update a comment. |
| `DELETE` | `/comment/:id` | Owner or Admin | Delete a comment. |
| `POST` | `/report/:post_id` | Authenticated | Create or replace the current user's report for a post. |
| `GET` | `/report/:id` | Owner or Admin | Return a report. |
| `GET` | `/reports` | Admin | List and search reports. |
| `PUT` | `/report/:id` | Owner or Admin | Update a report. |
| `DELETE` | `/report/:id` | Owner or Admin | Delete a report. |
| `DELETE` | `/report/post/:post_id` | Authenticated | Delete the current user's report for a post. |
| `POST` | `/reaction/:post_id` | Authenticated | Create or replace the current user's reaction to a post. |
| `GET` | `/reaction/:id` | Authenticated | Return a reaction. |
| `PUT` | `/reaction/:id` | Owner or Admin | Update a reaction. |
| `DELETE` | `/reaction/:id` | Owner or Admin | Delete a reaction. |
| `DELETE` | `/reaction/post/:post_id` | Authenticated | Delete the current user's reaction to a post. |

### Categories

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/categories` | Authenticated | List/search categories with post counts. |
| `POST` | `/category` | Admin | Create a category. |
| `PUT` | `/category/:id` | Admin | Update a category; category ID `1` is protected. |
| `DELETE` | `/category/:id` | Admin | Delete a category; category ID `1` is protected. |

## Query parameters

The post-list endpoints (`/posts`, `/user/posts`, and `/posts/user/:id`) accept:

| Parameter | Description |
| --- | --- |
| `page` and `limit` | Positive integers. When paginating, both must be supplied together. |
| `search` | Case-insensitive search term. |
| `searchIn` | Restrict `search` to `title` or `description`; requires `search`. |
| `category` | Case-insensitive category-name filter with a minimum length of three. |

`/categories` and `/reports` accept optional `page`, `limit`, and `search` values. Their current schemas do not require `page` and `limit` to be supplied together.

`/post/:id/details` passes `page` and `limit` directly to comment pagination. Supply both values as positive integers; unlike the post-list endpoints, this route does not currently validate these query parameters.

## Authorization

The policy engine combines the authenticated user's role with the requested action and, where necessary, the loaded resource:

- `Admin` can manage users, posts, comments, reports, reactions, and categories, list reports/users, and open Swagger UI.
- `User` can create and view application content, but can update or delete only their own posts, comments, reports, and reactions.
- Only admins can create, update, or delete categories and manage other user accounts through `/user/:id`.
- Resource loaders fetch the target row before owner-sensitive policy checks.

## npm scripts

| Command | Action |
| --- | --- |
| `npm start` | Run `node server.js`; environment variables must already be available. |
| `npm run build` | Generate Prisma Client. |
| `npm run db:push` | Push the Prisma schema to the configured database. |
| `npm run db:push:force` | Push the schema while accepting possible data loss. Use with care. |
| `npm run prisma:studio` | Open Prisma Studio. |

`postinstall` also generates Prisma Client automatically. `npm run db:seed` is declared in `package.json`, but `prisma/seed.js` is not present in this repository.

## Deployment notes

For a hosted Node service:

- Build command: `npm run build`
- Start command: `npm start`
- Provide `DATABASE_URL`, `SESSION_SECRET`, `FRONTEND_URL`, and `NODE_ENV=production` through the platform.
- Run `npm run db:push` against the production database before the application starts if the schema has not been created by another release process.
- Terminate HTTPS in front of Express. The server trusts one proxy hop and enables secure cookies in production.
- Make sure the frontend sends credentialed requests and that `FRONTEND_URL` exactly matches its origin.

The Swagger specification currently advertises `/api` as its server URL, while Express itself mounts routes at `/`. A deployment that exposes the API under `/api` must provide the corresponding proxy/rewrite behavior.

## Current implementation notes

- `middlewares/rateLimiter.js` contains an Upstash Redis fixed-window login limiter, but `router.js` does not import or attach it, so rate limiting is not active.
- `config/redis.js` and the Redis environment variables are therefore not needed for the current request path.
- There is currently no automated test script in `package.json`.

## License

No license file is currently included in this repository.
