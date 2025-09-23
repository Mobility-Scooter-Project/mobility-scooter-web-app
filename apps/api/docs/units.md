# Team/Unit CRUD Routes

## Overview
This module provides API endpoints and business logic for managing teams/units within tenants. It supports creating, updating, inviting users, listing users, and removing users from units.

## Endpoints

### Create a new unit
- `POST /tenant/{tenantId}/units`
  - Creates a new unit for a tenant.
  - Request body: `{ adminUserId?: string }`
  - Response: Created unit object

### Update a unit
- `PUT /tenant/{tenantId}/unit/{unitId}`
  - Updates an existing unit's fields (e.g., adminUserId).
  - Request body: Partial unit fields
  - Response: Updated unit object

### Invite a user to a unit
- `POST /tenant/{tenantId}/unit/{unitId}/invite`
  - Returns a JWT invite token containing tenantId and unitId, valid for 7 days.
  - Response: `{ token: string }`

- `POST /unit/invite/accept?token={token}`
  - Accepts an invite and adds the user to the unit specified in the token.
  - Request body: `{ userId: string }`
  - Response: `{ unitId, tenantId, user }`

### List users in a unit
- `GET /tenant/{tenantId}/unit/{unitId}/users?fields={userId,email...}&limit={limit}&offset={offset}`
  - Returns users belonging to a unit, with optional field selection and pagination.
  - Response: `{ users: [...] }`

### Remove a user from a unit
- `DELETE /tenant/{tenantId}/unit/{unitId}/users/{userId}`
  - Removes a user from the specified unit.
  - Response: Empty (204)

## Structure
- Handlers: `/src/handlers/units/index.ts`
- Service: `/src/services/unit.ts`
- Repository: `/src/repositories/tenants/unit.ts`
- Database schema: `/src/db/schema/tenants.ts`, `/src/db/schema/auth.ts`
- Tests: `/tests/integration/unit/`
- HTTP test file: `/src/handlers/units/units.http`

## Notes
- All functions are documented in code.
- Rate limiting should be added via middleware for production.
- Invite token expiration and validation are handled in the service.
- All errors are returned as structured JSON with appropriate HTTP codes.

## Testing
- Use the provided `.http` file for manual route testing.
- Automated tests should be added under `/tests/integration/unit/`.
