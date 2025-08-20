# SynapEvents API Documentation

## Table of Contents
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [WebSocket Support](#websocket-support)
- [Testing](#testing)
- [Deployment](#deployment)

## Getting Started

### Prerequisites
- Node.js 16+ and npm 8+
- PostgreSQL 13+
- Redis 6+ (for rate limiting and caching)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/synap-events.git
   cd synap-events/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Run database migrations:
   ```bash
   npm run migrate:up
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Access the API documentation at: http://localhost:5000/api-docs

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the `Authorization` header:

```
Authorization: Bearer your-jwt-token
```

### Obtaining a Token

1. Register a new user:
   ```http
   POST /api/auth/register
   Content-Type: application/json

   {
     "name": "John Doe",
     "email": "john@example.com",
     "password": "securepassword123"
   }
   ```

2. Login to get a token:
   ```http
   POST /api/auth/login
   Content-Type: application/json

   {
     "email": "john@example.com",
     "password": "securepassword123"
   }
   ```

## API Endpoints

### Events

- `GET /api/events` - List all events
- `POST /api/events` - Create a new event (Admin/Organizer only)
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update an event
- `DELETE /api/events/:id` - Delete an event
- `POST /api/events/:id/register` - Register for an event
- `GET /api/events/:id/participants` - List event participants

### Teams

- `GET /api/teams` - List all teams (Admin/Organizer only)
- `POST /api/teams` - Create a new team
- `GET /api/teams/:id` - Get team details
- `PUT /api/teams/:id` - Update team information
- `DELETE /api/teams/:id` - Delete a team
- `POST /api/teams/join` - Join a team using invite code
- `GET /api/teams/:id/members` - List team members
- `PUT /api/teams/:teamId/members/:userId` - Update team member status/role

### Submissions

- `GET /api/submissions` - List all submissions (Admin/Organizer only)
- `POST /api/submissions` - Create a new submission
- `GET /api/submissions/:id` - Get submission details
- `PUT /api/submissions/:id` - Update a submission
- `DELETE /api/submissions/:id` - Delete a submission
- `GET /api/events/:eventId/submissions` - List submissions for an event
- `POST /api/submissions/:id/evaluations` - Submit an evaluation
- `GET /api/events/:eventId/leaderboard` - Get event leaderboard

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
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Rate Limiting

The API is rate limited to prevent abuse:
- 100 requests per 15 minutes per IP for public endpoints
- 1000 requests per 15 minutes per authenticated user

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

Run tests with:

```bash
npm test
```

## Deployment

### Production

1. Set `NODE_ENV=production` in your environment
2. Configure a process manager (PM2, systemd, etc.)
3. Set up a reverse proxy (Nginx, Apache)
4. Enable HTTPS with Let's Encrypt

### Docker

```bash
docker build -t synap-events-backend .
docker run -p 5000:5000 --env-file .env synap-events-backend
```

## License

MIT
