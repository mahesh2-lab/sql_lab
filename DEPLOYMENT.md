# SQL Lab - Deployment Guide

## Quick Start

### Local Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

## Deployment Options

### Option 1: Docker (Recommended)

#### Build and run with Docker:
```bash
# Build the image
npm run docker:build

# Run the container
npm run docker:run
```

#### Or use Docker Compose:
```bash
# Start the app
docker-compose up -d

# With nginx reverse proxy
docker-compose --profile with-nginx up -d

# Stop
docker-compose down
```

### Option 2: Node.js Direct

1. Build the application:
```bash
npm run build
```

2. Set environment variables:
```bash
export NODE_ENV=production
export PORT=5000
```

3. Start the server:
```bash
npm run start
```

### Option 3: Cloud Platforms

#### Render / Railway / Fly.io
These platforms auto-detect Node.js apps. Just push your code and they'll:
1. Run `npm install`
2. Run `npm run build`
3. Run `npm run start`

Set these environment variables:
- `NODE_ENV=production`
- `PORT` (usually auto-set by the platform)

#### Vercel (Serverless)
Not recommended for this app as it uses a stateful Express server.

#### AWS / GCP / Azure
Use the Docker image or deploy to:
- AWS ECS / App Runner
- Google Cloud Run
- Azure Container Apps

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure proper `PORT`
- [ ] Set up SSL/HTTPS (use nginx or cloud load balancer)
- [ ] Configure health checks at `/api/health`
- [ ] Set up logging and monitoring
- [ ] Configure rate limiting (nginx.conf or cloud WAF)

## Health Endpoints

- `GET /api/health` - Basic health check (returns 200 if server is running)
- `GET /api/ready` - Readiness check (confirms storage is accessible)

Use these endpoints for:
- Load balancer health checks
- Kubernetes liveness/readiness probes
- Container orchestration health monitoring

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | - | Set to `production` for production |
| `PORT` | No | 5000 | Port to listen on |

## Architecture

```
┌─────────────────┐     ┌──────────────────┐
│   nginx/LB      │────▶│  Express Server  │
│   (optional)    │     │   (port 5000)    │
└─────────────────┘     └──────────────────┘
                               │
                        ┌──────┴──────┐
                        │             │
                   ┌────▼────┐  ┌─────▼─────┐
                   │   API   │  │  Static   │
                   │ Routes  │  │  Files    │
                   └─────────┘  └───────────┘
```

## Troubleshooting

### Port already in use
```bash
# Find and kill process using port 5000
lsof -i :5000 | grep LISTEN
kill -9 <PID>
```

### Build failures
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Docker issues
```bash
# Rebuild without cache
docker build --no-cache -t sql-lab .

# Check logs
docker logs <container-id>
```
