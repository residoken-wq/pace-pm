# Nexus Project Hub - Docker Infrastructure

## Quick Start

```bash
# Start all services
docker compose up -d

# Access Nginx Proxy Manager
# URL: http://localhost:81
# Default: admin@example.com / changeme

# Stop all services
docker compose down
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| nginx-proxy-manager | 80, 443, 81 | Reverse proxy + SSL |
| postgres | 5432 | PostgreSQL database |
| redis | 6379 | Cache + sessions |
| api | 5000 | .NET 8 API (dev) |
| web | 4000 | Next.js frontend (dev) |
