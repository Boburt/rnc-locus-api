# RNC Locus API

NestJS REST API over the public RNAcentral PostgreSQL database, built as a test task for JS full-stack developer position.

## Stack

- **NestJS 10** + **TypeScript** (strict mode)
- **TypeORM** with `typeorm-naming-strategies` for camelCase ↔ snake_case mapping
- **PostgreSQL** (public read-only RNAcentral DB)
- **JWT** authentication via `passport-jwt`
- **Swagger** (OpenAPI 3.0) auto-generated from decorators
- **Jest** for unit and e2e tests
- **pnpm** as package manager

## Requirements

- Node.js 20+ (LTS)
- pnpm 8+

## Quick Start

```bash
# Clone
git clone https://github.com/Boburt/rnc-locus-api.git
cd rnc-locus-api

# Install
pnpm install

# Copy env template and adjust if needed
cp .env.example .env

# Run in dev mode
pnpm start:dev
```

The API will be available at `http://localhost:3000`.

Swagger UI: `http://localhost:3000/docs`.

## Predefined Users

Three users are hardcoded (as required by the task). Passwords are bcrypt-hashed in `src/modules/auth/constants/users.constant.ts`.

| Username | Password | Role |
|----------|----------|------|
| `admin` | `adminpass` | `admin` |
| `normal` | `normalpass` | `normal` |
| `limited` | `limitedpass` | `limited` |

## Roles and Access Control

| Role | Locus fields | Sideloading | Data scope |
|------|-------------|-------------|------------|
| `admin` | All 9 columns of `rnc_locus` | Allowed (sees all 5 member fields including `ursTaxid`) | Full |
| `normal` | All 9 columns of `rnc_locus` | **Forbidden (403)** | Full |
| `limited` | All 9 columns of `rnc_locus` | Allowed | Only locus with members matching `regionId ∈ {86118093, 86696489, 88186467}` |

## API Endpoints

### `POST /auth/login`

Request:
```json
{ "username": "admin", "password": "adminpass" }
```

Response:
```json
{ "accessToken": "eyJhbGci..." }
```

### `GET /locus`

Headers: `Authorization: Bearer <token>`

Query parameters:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | CSV of bigint | — | Filter by locus IDs, e.g. `?id=155095,155107` |
| `assemblyId` | string | — | Filter by assembly identifier |
| `regionId` | CSV of int | — | Filter by member region IDs |
| `membershipStatus` | enum | — | `member` or `highlighted` |
| `include` | enum | — | `locusMembers` to sideload related members |
| `page` | int | `1` | Page number (1-based) |
| `limit` | int | `1000` | Rows per page (max 5000) |
| `sortBy` | enum | `id` | `id` / `locusStart` / `locusStop` / `memberCount` |
| `sortOrder` | enum | `ASC` | `ASC` / `DESC` |

## Example curl Requests

```bash
# 1. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"adminpass"}'

# 2. Save token
TOKEN="<paste accessToken here>"

# 3. Basic request (admin, first 3 records, no sideloading)
curl "http://localhost:3000/locus?limit=3" -H "Authorization: Bearer $TOKEN"

# 4. With sideloading — each locus includes its members
curl "http://localhost:3000/locus?limit=3&include=locusMembers" \
  -H "Authorization: Bearer $TOKEN"

# 5. Filter by real regionId that exists in the DB
curl "http://localhost:3000/locus?regionId=182936&include=locusMembers" \
  -H "Authorization: Bearer $TOKEN"

# 6. Filter by membershipStatus
curl "http://localhost:3000/locus?membershipStatus=highlighted&limit=5&include=locusMembers" \
  -H "Authorization: Bearer $TOKEN"

# 7. Filter by multiple IDs
curl "http://localhost:3000/locus?id=155095,155107,155130" \
  -H "Authorization: Bearer $TOKEN"

# 8. Sorting and pagination
curl "http://localhost:3000/locus?sortBy=memberCount&sortOrder=DESC&page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

## Project Structure

```
src/
├── common/
│   ├── decorators/        # @Public, @Roles, @CurrentUser
│   ├── enums/             # UserRole
│   ├── guards/            # JwtAuthGuard, RolesGuard
│   └── interfaces/        # AuthUser
├── config/
│   ├── app.config.ts      # port, prefix, swagger path
│   ├── database.config.ts # DB connection
│   ├── jwt.config.ts      # JWT secret and TTL
│   └── env.validation.ts  # joi schema — validated on startup
├── modules/
│   ├── auth/
│   │   ├── constants/     # hardcoded users with bcrypt hashes
│   │   ├── dto/           # LoginDto, LoginResponseDto
│   │   ├── strategies/    # JwtStrategy
│   │   └── ...
│   └── locus/
│       ├── constants/     # allowed regionIds for "limited" role
│       ├── dto/           # GetLocusQueryDto, LocusResponseDto, LocusMemberResponseDto
│       ├── entities/      # Locus, LocusMember with @OneToMany / @ManyToOne
│       ├── enums/         # MembershipStatus, LocusSortField, LocusSideloadInclude, SortOrder
│       └── ...
├── app.module.ts
└── main.ts
```

## Design Notes

Several decisions were made where the task description and the actual database state disagreed. These are intentional.

1. **`rld` in the task description is treated as a typo** — read as `rlm` (`rnc_locus_members`). The SQL statement at the bottom of the task uses `rlm`, confirming this.

2. **`assemblyId` is string, not int**. The task says "int, single value", but the database column is `text` and task examples contain strings like `"WEWSeq_v.1.0"` and `"Rrox_v1"`. Implemented as string.

3. **`id` and `locusId` are strings, not numbers**. Both are `bigint` in the database. The `pg` driver returns bigint as string to avoid precision loss (JS `Number` cannot safely hold values > `2^53 − 1`). The CSV filter for `id` accepts numeric strings.

4. **`ursTaxid` is only inside `locusMembers[]`, not on the locus level**. The task example shows `urs_taxid` on the locus with sideloading, but the database column lives in `rnc_locus_members`. Since a locus can have multiple members with different `ursTaxid`, hoisting a single value would be arbitrary. Returned only inside member objects.

5. **`membershipStatus` is an enum with exactly two values** — `member` and `highlighted` (verified by `SELECT DISTINCT` on the real database). Implemented as a TypeScript enum; the DTO rejects other values with 400.

6. **`limited` role returns `[]` on the current DB snapshot**. The task specifies `regionId ∈ {86118093, 86696489, 88186467}`, but `SELECT COUNT(DISTINCT locus_id) FROM rnc_locus_members WHERE region_id IN (...)` returns 0 on the public snapshot. The role's logic is verified by unit and e2e tests with mocked repositories; behavior on real data is an artifact of the snapshot, not a bug.

7. **For `limited` + sideloading — `locusMembers` is filtered by allowed regionIds**. The filter is applied in the JOIN's `ON` clause, so the limited user never sees members with forbidden regionIds, even through sideloading.

8. **No raw SQL**. All queries are built via TypeORM's QueryBuilder with parameterized placeholders. Relations (`@OneToMany`, `@ManyToOne`) are defined in entity classes. QueryBuilder was chosen over `repository.find()` because `limited` role requires filtering members in the JOIN's `ON` clause (not `WHERE`), and conditional JOINs are cleaner with QueryBuilder.

9. **`SnakeNamingStrategy`** from `typeorm-naming-strategies` handles the camelCase (code) ↔ snake_case (DB) mapping automatically, as suggested in the task's "Additional references" section.

10. **Global `ValidationPipe`** with `whitelist`, `forbidNonWhitelisted`, `transform` and `enableImplicitConversion` provides strict input validation: unknown query parameters are rejected with 400, strings are auto-converted to numbers where the DTO type requires it.

## Testing

```bash
# Unit tests — service-level logic with mocked dependencies
pnpm test

# E2E tests — full HTTP stack with mocked repositories
pnpm run test:e2e

# Coverage report
pnpm run test:cov
```

Coverage includes:
- `AuthService` — login flow, password validation, user lookup
- `LocusService` — role-based JOIN decisions, sideloading permissions, pagination, allowed regionIds for `limited`
- `POST /auth/login` — success, wrong password, missing body
- `GET /locus` — unauthorized, forbidden (normal + sideloading), unknown query parameter, valid admin request

## Environment Variables

See `.env.example` for the full list. All variables are validated on startup via joi (`src/config/env.validation.ts`) — missing or malformed values prevent the app from starting.

```
APP_PORT=3000
APP_GLOBAL_PREFIX=api/v1
NODE_ENV=development

DB_HOST=hh-pgsql-public.ebi.ac.uk
DB_PORT=5432
DB_NAME=pfmegrnargs
DB_USER=reader
DB_PASSWORD=NWDMCE5xdipIjRrp

JWT_SECRET=<long-random-string>
JWT_EXPIRES_IN=1h

SWAGGER_PATH=docs
```

## Database Schema (Reference)

Verified via `information_schema` on the public RNAcentral DB:

**`rnc_locus`** — 1,622,200 rows, all columns `NOT NULL`:

| Column | Type |
|--------|------|
| `id` | `bigint` (PK) |
| `assembly_id` | `text` |
| `locus_name` | `text` |
| `public_locus_name` | `text` |
| `chromosome` | `text` |
| `strand` | `text` |
| `locus_start` | `integer` |
| `locus_stop` | `integer` |
| `member_count` | `integer` |

**`rnc_locus_members`** — 1,059,299 rows, all columns `NOT NULL`:

| Column | Type |
|--------|------|
| `id` | `bigint` (PK) |
| `urs_taxid` | `text` |
| `region_id` | `integer` |
| `locus_id` | `bigint` (FK → `rnc_locus.id`) |
| `membership_status` | `text` (`member` or `highlighted`) |

## License

ISC