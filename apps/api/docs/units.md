# Team/Unit CRUD Routes

## Overview
This module provides API endpoints and business logic for managing teams/units within tenants. It supports creating, updating, inviting users, listing users, and removing users from units.

## Rate Limits
The API implements comprehensive rate limiting with Redis persistence to prevent abuse and ensure fair usage:

### Authentication Rate Limits
- **Sign Up**: 50 requests per 8 hours (IP-based, designed for team onboarding)
- **Sign In**: 5 attempts per 30 minutes (email + IP combination, matches Windows lockout policy)
- **OTP Requests**: 5 attempts per 30 minutes (userId + IP combination)
- **Password Reset**: 3 attempts per 24 hours (email + IP combination)

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

- `POST /unit/invite/accept?token=...`
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
  - **No direct database access** - uses service layer
  
- Service: `/src/services/unit.ts`
  - Business logic and orchestration
  - JWT invite token generation/validation (7-day expiration)
  - User management operations
  - Error handling and validation
  - **Separation of concerns** - no direct database queries
  
- Repository: `/src/repositories/tenants/unit.ts`
  - Db operations only
  
- Schema: 
  - `/src/db/schema/tenants.ts`
  - `/src/db/schema/auth.ts`
  
- Tests: 
  - `/tests/unit/unit-crud-comprehensive.test.ts` - Unit tests for UnitService business logic (25 tests)
  - `/tests/unit/unit-routes-integration.test.ts` - Integration tests for HTTP routes (24 tests)
  - **Total Coverage**: 49 tests covering all endpoints, edge cases, and error scenarios
  - **Test Categories**: Service logic, HTTP routes, error handling, validation, concurrent operations
  
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
6. Add tests:
   - Unit tests: `tests/unit/` for service logic testing
   - Integration tests: `tests/unit/` for route testing
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
   # Run all tests (includes server startup)
   pnpm test
   
   # Run unit tests only
   ENVIRONMENT=test npx jest tests/unit/
   
   # Run specific test file
   ENVIRONMENT=test npx jest tests/unit/unit-crud-comprehensive.test.ts
   ```
## Future Improvements?
- [ ] Add support for bulk user operations
- [ ] Implement unit hierarchy/nesting
- [ ] Add unit access roles/permissions
- [ ] Support unit metadata/settings
- [ ] Add audit logging for unit changes
