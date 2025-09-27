# Team/Unit CRUD Routes

## Overview
This module provides API endpoints and business logic for managing teams/units within tenants. It supports creating, updating, inviting users, listing users, and removing users from units.

## Rate Limits
Each operation has specific rate limits to prevent abuse:
- Unit Creation: 10 requests/hour (resource intensive)
- Unit Updates: 30 requests/hour (moderate usage)
- Invite Operations: 20 requests/hour (security sensitive)
- User Management: 100 requests/hour (frequent usage)
- List Operations: 200 requests/hour (read-only)

Rate limits are per IP address and operation type.

## Endpoints

### Create a new unit
- `POST /tenant/{tenantId}/units`
  - Creates a new unit for a tenant.
  - Request body: `{ adminUserId?: string }`
  - Response: Created unit object
  - Rate limit: 10 requests/hour
  - Auth required: Yes (API Key + User Token)

### Update a unit
- `PUT /tenant/{tenantId}/unit/{unitId}`
  - Updates an existing unit's fields (e.g., adminUserId).
  - Request body: Partial unit fields
  - Response: Updated unit object
  - Rate limit: 30 requests/hour
  - Auth required: Yes (API Key + User Token)

### Unit Invites
- `POST /tenant/{tenantId}/unit/{unitId}/invite`
  - Returns a JWT invite token containing tenantId and unitId, valid for 7 days.
  - Response: `{ token: string }`
  - Rate limit: 20 requests/hour
  - Auth required: Yes (API Key + User Token)

- `POST /tenant/{tenantId}/unit/invite/accept`
  - Accepts an invite and adds the user to the unit specified in the token.
  - Request body: `{ userId: string }`
  - Query params: `token` (required)
  - Response: `{ unitId, tenantId, user }`
  - Rate limit: 20 requests/hour
  - Auth required: Yes (API Key + User Token)

### User Management
- `GET /tenant/{tenantId}/unit/{unitId}/users`
  - Returns users belonging to a unit, with optional field selection and pagination.
  - Query params:
    - `fields`: Comma-separated list of user fields (id, email, firstName, lastName, etc.)
    - `limit`: Maximum number of users to return (default: 50)
    - `offset`: Pagination offset (default: 0)
  - Response: `{ users: [...] }`
  - Rate limit: 200 requests/hour
  - Auth required: Yes (API Key + User Token)

- `DELETE /tenant/{tenantId}/unit/{unitId}/users/{userId}`
  - Removes a user from the specified unit.
  - Response: Empty (204)
  - Rate limit: 100 requests/hour
  - Auth required: Yes (API Key + User Token)

## Authentication
All endpoints require:
1. API Key in `Authorization: Bearer <api-key>` header
2. User JWT token in `X-User: <token>` header

## Error Handling
All errors follow a consistent format:
```json
{
  "error": "Error message",
  "data": null // Optional partial data
}
```

Common error codes:
- 400: Bad Request (invalid input)
- 401: Unauthorized (invalid/missing token)
- 403: Forbidden (rate limit exceeded)
- 404: Not Found (unit/user not found)
- 500: Internal Server Error

## Project Structure
- Handlers: `/src/handlers/units/index.ts`
  - HTTP route definitions
  - Request/response handling
  - Input validation
  - Rate limiting
  
- Service: `/src/services/unit.ts`
  - Business logic
  - Invite token generation/validation
  - User management operations
  
- Repository: `/src/repositories/tenants/unit.ts`
  - Database operations
  - Type-safe Drizzle queries
  - Data validation
  
- Schema: 
  - `/src/db/schema/tenants.ts`
  - `/src/db/schema/auth.ts`
  
- Tests: `/tests/integration/unit/unit.test.ts`
  - Integration tests
  - Edge cases
  - Error scenarios
  
- HTTP Tests: `/http/units/units.http`
  - Manual API testing
  - Example requests
  - Environment variables

## Development
1. Update schema if needed (`db/schema/`)
2. Create/update repository functions (`repositories/tenants/unit.ts`)
3. Add business logic in service (`services/unit.ts`)
4. Create route handlers (`handlers/units/index.ts`)
5. Add rate limits for new endpoints
6. Add tests (`tests/integration/unit/`)
7. Update HTTP test file (`http/units/units.http`)

## Testing
1. Manual Testing:
   ```bash
   # In VS Code
   1. Set up .env variables
   2. Open units.http
   3. Use "Send Request" buttons
   ```

2. Automated Testing:
   ```bash
   pnpm test
   ```

## Future Improvements
- [ ] Add support for bulk user operations
- [ ] Implement unit hierarchy/nesting
- [ ] Add unit access roles/permissions
- [ ] Support unit metadata/settings
- [ ] Add audit logging for unit changes
