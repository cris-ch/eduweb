# A+ Academy Web Server

## Overview
This is the backend server for A+ Academy's web application. It provides user authentication, profile management, and role-based access control using Firebase.

## Features
- User authentication with Firebase
- User profile management
- Role-based access control
- Input validation
- Rate limiting
- Request logging
- Error handling
- CORS protection
- Security headers
- Compression
- Health checks

## Prerequisites
- Node.js >= 18.0.0
- npm
- Firebase project with Admin SDK credentials

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd eduweb/server
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your Firebase credentials and other configuration.

4. Place your Firebase Admin SDK credentials in `serviceAccountKey.json`

## Development

Start the development server:
```bash
npm run dev
```

The server will run on http://localhost:5000 by default.

## Production

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Start the production server:
```bash
npm run prod
```

## Scripts
- `npm start` - Start the server
- `npm run dev` - Start development server with hot reload
- `npm run prod` - Start production server with PM2
- `npm run prod:stop` - Stop production server
- `npm run prod:restart` - Restart production server
- `npm run prod:logs` - View production logs
- `npm run test` - Run tests
- `npm run lint` - Run linter
- `npm run format` - Format code

## API Endpoints

### Public Endpoints
- `GET /health` - Health check

### Protected Endpoints (requires authentication)
- `GET /api/user/profile` - Get user profile
- `POST /api/user/profile` - Create/update user profile
- `GET /api/user/role` - Get user role

## Error Handling
All errors are logged to `logs/error.log`. In production, error details are not sent to clients for security.

## Logging
- Access logs: `logs/access.log`
- Error logs: `logs/error.log`
- Combined logs: `logs/combined.log`

## Security
- CORS protection
- Rate limiting
- Helmet security headers
- Input validation
- Token verification

## Contributing
1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License
This project is proprietary and confidential.
