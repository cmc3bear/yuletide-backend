# Yuletide Gift Tracker - Backend API

Express.js REST API with SQLite database for managing gift data across devices.

## Features

- **REST API** - Full CRUD operations for gifts
- **SQLite Database** - Simple, file-based database (no setup required)
- **CORS Enabled** - Works with any frontend
- **Auto-initialization** - Creates database and seed data automatically

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```

The server will run on `http://localhost:3000` by default.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gifts` | Get all gifts |
| GET | `/api/gifts/:id` | Get single gift by ID |
| POST | `/api/gifts` | Create new gift |
| PUT | `/api/gifts/:id` | Update gift |
| DELETE | `/api/gifts/:id` | Delete gift |
| GET | `/api/health` | Health check |

## Request/Response Examples

### Create Gift
```bash
POST /api/gifts
Content-Type: application/json

{
  "kid": "Ben",
  "item": "Lego Set",
  "link": "https://amazon.com/...",
  "helper": "Cary",
  "deliveryDate": "2024-12-20"
}
```

### Update Gift
```bash
PUT /api/gifts/1
Content-Type: application/json

{
  "kid": "Ben",
  "item": "Updated Lego Set",
  "link": "https://amazon.com/...",
  "helper": "Mariana",
  "deliveryDate": "2024-12-20"
}
```

## Deployment Options

### Option 1: Railway.app (Recommended - Free tier available)
1. Create account at railway.app
2. Connect GitHub repo
3. Deploy automatically

### Option 2: Render.com (Free tier available)
1. Create account at render.com
2. Connect GitHub repo
3. Deploy as Web Service

### Option 3: AWS EC2
1. Launch EC2 instance
2. Install Node.js
3. Clone repo and run `npm start`

### Option 4: Vercel (Serverless)
Requires modification to use serverless functions instead of Express server.

## Environment Variables

- `PORT` - Server port (default: 3000)

## Database

- SQLite database file: `yuletide.db`
- Auto-created on first run
- Pre-populated with sample gift data

## Security Notes

For production deployment:
- Add rate limiting
- Add authentication/authorization
- Use environment variables for sensitive data
- Enable HTTPS
- Add input validation/sanitization
