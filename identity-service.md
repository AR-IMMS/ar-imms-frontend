# Identity Service API Contract

## Scope

This document describes the current frontend-facing REST contract implemented in `backend/apps/control-plane/identity-service`.

It is derived from the current NestJS controllers, DTOs, and bootstrap configuration in the codebase. Where the code is explicit, this document uses confirmed behavior. Where a response body is assembled indirectly by use cases, the response is documented as a shape summary based on the current DTOs and return types.

## Service Basics

- Service name: `identity-service`
- Current global prefix: `API_PREFIX` environment variable, defaulting to `/api/v1`
- Swagger path in non-production: `/{API_PREFIX}/docs`
- Primary responsibility: authentication, session refresh, current user lookup, user administration, and role lookup

## Transport and Header Rules

- Transport: `REST`
- Content type: `application/json`
- Recommended correlation header: `X-Correlation-Id`
- Recommended request ID header: `X-Request-Id`
- Auth header for protected endpoints: `Authorization: Bearer <accessToken>`

## Response Behavior

`identity-service` currently returns raw JSON objects from controller methods rather than the preferred `{ data, meta }` envelope described in [CONTRACTS.md](/D:/Study/FPTU/WDP301/projects/AR-based-Infrastructure-Monitoring-and-Maintenance-System/CONTRACTS.md).

Frontend consumers should therefore expect raw payloads for current endpoints in this service.

## Domain Enums Used By Current API

### `RoleCode`

- `IT_ADMINISTRATOR`
- `SYSTEM_MONITORING_OPERATOR`
- `MAINTENANCE_TECHNICIAN`

### `UserStatus`

- `ACTIVE`
- `LOCKED`
- `INACTIVE`

### `SortDirection`

- `ASC`
- `DESC`

### `UserSortField`

Current code exposes `UserSortField` as an enum in the list users query DTO. Frontend should treat it as a backend-defined enum and sync values from Swagger or backend source when generating typed clients.

## Shared Shapes

### Authenticated User

```json
{
  "id": "user-id",
  "username": "operator01",
  "email": "operator01@example.com",
  "fullName": "Nguyen Van A",
  "phoneNumber": "+84901234567",
  "jobTitle": "Maintenance Technician",
  "department": "Operations",
  "avatarUrl": "https://example.com/avatar.png",
  "status": "ACTIVE",
  "roleCodes": ["SYSTEM_MONITORING_OPERATOR"],
  "permissions": ["DASHBOARD_READ"],
  "mustChangePassword": false,
  "passwordChangedAt": "2026-06-01T08:30:00.000Z",
  "lastLoginAt": "2026-06-11T09:15:00.000Z",
  "createdAt": "2026-05-20T10:00:00.000Z",
  "updatedAt": "2026-06-11T09:15:00.000Z"
}
```

### Token Pair

```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "refresh-token",
  "sessionId": "665b9f053a5d8b6cc4915d17"
}
```

## Endpoints

### `GET /api/v1/health`

- Auth: none
- Purpose: service health check

Example response:

```json
{
  "status": "ok",
  "service": "identity-service"
}
```

### `POST /api/v1/auth/login`

- Auth: none
- Purpose: authenticate a user and create a session
- Extra request context:
  - `user-agent` header is read when present
  - client IP is read from the request

Request body:

```json
{
  "email": "admin@example.com",
  "password": "Admin@123456"
}
```

Validation rules:

- `email` is required and must be a valid email
- `password` is required and must be at least 8 characters

Response shape:

```json
{
  "user": {
    "id": "user-id",
    "username": "admin",
    "email": "admin@example.com",
    "fullName": "Admin User",
    "status": "ACTIVE",
    "roleCodes": ["IT_ADMINISTRATOR"],
    "permissions": ["IDENTITY_USERS_MANAGE", "DASHBOARD_READ"],
    "mustChangePassword": false
  },
  "tokens": {
    "accessToken": "jwt-access-token",
    "refreshToken": "refresh-token",
    "sessionId": "665b9f053a5d8b6cc4915d17"
  }
}
```

### `POST /api/v1/auth/refresh`

- Auth: none
- Purpose: rotate refresh token and issue a new access token

Request body:

```json
{
  "sessionId": "665b9f053a5d8b6cc4915d17",
  "refreshToken": "4ef3adf4-4424-4b66-a2e8-f9922f0f8ab9"
}
```

Validation rules:

- `sessionId` is required
- `refreshToken` is required

Response body:

```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "next-refresh-token",
  "sessionId": "665b9f053a5d8b6cc4915d17"
}
```

### `POST /api/v1/auth/logout`

- Auth: bearer token required
- Guards: `JwtAuthGuard`
- Purpose: revoke the current authenticated session

Response body:

```json
{
  "success": true
}
```

### `GET /api/v1/auth/me`

- Auth: bearer token required
- Guards: `JwtAuthGuard`
- Purpose: fetch the current authenticated user profile

Response body:

Returns the `AuthenticatedUser` shape shown above.

### `POST /api/v1/auth/change-password`

- Auth: bearer token required
- Guards: `JwtAuthGuard`
- Purpose: change current user password and revoke existing sessions

Request body:

```json
{
  "currentPassword": "TempPass@123",
  "newPassword": "NewStrongPass@123"
}
```

Validation rules:

- both fields are required strings
- `newPassword` must be at least 8 characters

Response body:

```json
{
  "success": true,
  "reauthenticationRequired": true
}
```

### `GET /api/v1/roles`

- Auth: none in current controller implementation
- Purpose: return the available identity roles

Important note:

Current code does not apply `JwtAuthGuard` or permission guards to this controller. Frontend should treat this as the current implementation behavior, not as a long-term security guarantee.

Response shape:

Returns an array of role entities from the role repository. At minimum, frontend should expect each item to include a stable role code. Additional role metadata depends on the domain entity implementation.

Representative response:

```json
[
  {
    "code": "IT_ADMINISTRATOR",
    "name": "IT Administrator"
  },
  {
    "code": "SYSTEM_MONITORING_OPERATOR",
    "name": "System Monitoring Operator"
  }
]
```

### `POST /api/v1/admin/users`

- Auth: bearer token required
- Guards: `JwtAuthGuard`, `PasswordChangeRequiredGuard`, `PermissionsGuard`
- Required permission: `IDENTITY_USERS_MANAGE`
- Purpose: create a new identity user

Request body:

```json
{
  "username": "operator01",
  "email": "operator01@example.com",
  "fullName": "Nguyen Van A",
  "phoneNumber": "+84901234567",
  "jobTitle": "Maintenance Technician",
  "department": "Operations",
  "avatarUrl": "https://example.com/avatars/operator01.png",
  "roleCodes": ["SYSTEM_MONITORING_OPERATOR"]
}
```

Validation rules:

- `username`, `email`, and `fullName` are required
- `avatarUrl` must be a valid URL if provided
- `roleCodes` must be an array of valid `RoleCode` values if provided

Response shape:

Returns the created admin user view. Frontend should expect the same core user fields as `AuthenticatedUser`, without relying on a `permissions` array unless the backend returns it explicitly.

### `PATCH /api/v1/admin/users/:id/status`

- Auth: bearer token required
- Required permission: `IDENTITY_USERS_MANAGE`
- Purpose: update lifecycle status of a user

Path params:

- `id`: user identifier

Request body:

```json
{
  "status": "LOCKED"
}
```

Response shape:

Returns the updated user record or an equivalent update result defined by the use case. Frontend should primarily rely on the resulting `status` value and stable user identity fields.

### `PUT /api/v1/admin/users/:id/roles`

- Auth: bearer token required
- Required permission: `IDENTITY_USERS_MANAGE`
- Purpose: replace or assign role codes for a user

Path params:

- `id`: user identifier

Request body:

```json
{
  "roleCodes": ["MAINTENANCE_TECHNICIAN"]
}
```

Validation rules:

- `roleCodes` must be a non-empty array
- every item must be a valid `RoleCode`

Response shape:

Returns the updated user record or a use-case result reflecting assigned roles.

### `GET /api/v1/admin/users`

- Auth: bearer token required
- Required permission: `IDENTITY_USERS_MANAGE`
- Purpose: list users with filters, sorting, and pagination

Query params:

- `page`: integer, default `1`, min `1`
- `limit`: integer, default `20`, min `1`, max `100`
- `username`: optional string filter
- `email`: optional string filter
- `status`: optional `UserStatus`
- `roleCodes`: optional repeated or array-like `RoleCode` filter
- `sortBy`: optional `UserSortField`, default `CREATED_AT`
- `sortDirection`: optional `SortDirection`, default `DESC`

Example query:

```text
/api/v1/admin/users?page=1&limit=20&status=ACTIVE&roleCodes=SYSTEM_MONITORING_OPERATOR
```

Response shape:

The controller delegates to `ListUsersUseCase`. Frontend should expect a paginated result structure owned by that use case. At minimum, rely on:

- a collection of user items
- pagination metadata such as page and limit when returned

### `GET /api/v1/admin/users/:username`

- Auth: bearer token required
- Required permission: `IDENTITY_USERS_MANAGE`
- Purpose: get a user by username with the same filtering DTO currently accepted by the controller

Path params:

- `username`: username string

Query params:

Uses the same `ListUsersQueryDto` as the list endpoint.

Important note:

This route currently accepts `:username` as a path segment rather than `:id`. Because `GET /admin/users/:username` overlaps semantically with listing, frontend should avoid ambiguous usernames that might be confused with future reserved path names.

## Error Contract

Current codebase uses NestJS exceptions and use-case errors. Frontend should standardize handling around the repository contract standard in [CONTRACTS.md](/D:/Study/FPTU/WDP301/projects/AR-based-Infrastructure-Monitoring-and-Maintenance-System/CONTRACTS.md):

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found",
    "details": {}
  },
  "meta": {
    "requestId": "request-id",
    "correlationId": "correlation-id",
    "version": "v1",
    "timestamp": "2026-06-11T10:00:00.000Z"
  }
}
```

Likely error cases for current identity flows:

- invalid credentials
- inactive or locked user
- expired or invalid session
- forbidden permission access
- validation failure on DTOs

## Frontend Notes

- Treat `/roles` as publicly readable in the current implementation, but isolate that assumption in one frontend service in case guards are added later.
- Treat `identity-service` responses as raw payloads, not `{ data, meta }` envelopes.
- Always store `sessionId` together with `refreshToken` because refresh requires both values.
