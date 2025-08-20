# SynapEvents API Documentation

Welcome to the SynapEvents API documentation! This guide will help you understand how to interact with the API and explore its endpoints using Swagger UI.

## Table of Contents
- [Accessing the API Documentation](#accessing-the-api-documentation)
- [Authentication](#authentication)
- [Available Endpoints](#available-endpoints)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [WebSocket Support](#websocket-support)

## Accessing the API Documentation

1. **Development Environment**:
   - Start the development server:
     ```bash
     npm run dev
     ```
   - Access the Swagger UI at: http://localhost:5000/api-docs

2. **Production Environment**:
   - The API documentation is not enabled in production by default for security reasons.
   - To enable it in production, set `NODE_ENV` to a value other than 'production'.

## Authentication

Most endpoints require authentication using JWT tokens. Here's how to authenticate:

1. **Register a new user** (if you don't have an account):
   ```http
   POST /api/auth/register
   ```
   ```json
   {
     "name": "Your Name",
     "email": "your.email@example.com",
     "password": "your-secure-password"
   }
   ```

2. **Login to get an access token**:
   ```http
   POST /api/auth/login
   ```
   ```json
   {
     "email": "your.email@example.com",
     "password": "your-secure-password"
   }
   ```

3. **Use the access token**:
   - Add the token to the `Authorization` header for protected endpoints:
     ```
     Authorization: Bearer your-access-token
     ```

## Available Endpoints

The API is organized into the following sections:

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Authenticate and get tokens
- `POST /auth/refresh-token` - Refresh access token
- `POST /auth/logout` - Invalidate the current token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token

### Users
- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update current user profile
- `PATCH /users/me/password` - Change password

### Events
- `GET /events` - List all events
- `POST /events` - Create a new event (Admin/Organizer only)
- `GET /events/:id` - Get event details
- `PATCH /events/:id` - Update an event
- `DELETE /events/:id` - Delete an event
- `POST /events/:id/register` - Register for an event
- `GET /events/:id/participants` - List event participants

### Teams
- `GET /teams` - List all teams (Admin/Organizer only)
- `POST /teams` - Create a new team
- `GET /teams/:id` - Get team details
- `PATCH /teams/:id` - Update team information
- `DELETE /teams/:id` - Delete a team
- `POST /teams/join` - Join a team using invite code
- `GET /teams/:id/members` - List team members
- `PATCH /teams/:teamId/members/:userId` - Update team member status/role

### Submissions
- `GET /submissions` - List all submissions (Admin/Organizer only)
- `POST /submissions` - Create a new submission
- `GET /submissions/:id` - Get submission details
- `PATCH /submissions/:id` - Update a submission
- `DELETE /submissions/:id` - Delete a submission
- `GET /events/:eventId/submissions` - List submissions for an event
- `POST /submissions/:id/evaluations` - Submit an evaluation
- `GET /events/:eventId/leaderboard` - Get event leaderboard

## Rate Limiting

The API is rate limited to prevent abuse:
- 100 requests per 15 minutes per IP for public endpoints
- 1000 requests per 15 minutes per authenticated user

## Error Handling

Errors follow this format:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (in development)",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Common HTTP Status Codes
- `200 OK` - Request successful
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## WebSocket Support

Real-time features are available via WebSocket at `/ws`. Available events:

- `event:created` - New event created
- `event:updated` - Event updated
- `event:deleted` - Event deleted
- `team:joined` - User joined a team
- `submission:created` - New submission
- `submission:updated` - Submission updated
- `evaluation:submitted` - New evaluation submitted

## Testing

Run the test suite with:
```bash
npm test
```

## Development

To generate the OpenAPI specification:
```bash
npm run docs:build
```
This will generate `docs/openapi.json` and `docs/openapi.yaml` files.

## License

MIT
