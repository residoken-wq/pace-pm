# Nexus Project Hub

> **"Tối giản bên ngoài, Mạnh mẽ bên trong"**

Modern Project Management App với tích hợp Microsoft 365.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (recommended)
- Docker & Docker Compose
- Microsoft 365 Tenant (admin access)

### Development

```bash
# Frontend
cd apps/web
npm install
npm run dev

# Open http://localhost:3000
```

### Infrastructure (VPS)

```bash
# Start all services
docker compose up -d

# Access Nginx Proxy Manager: http://YOUR_IP:81
# Default: admin@example.com / changeme
```

## 📁 Project Structure

```
nexus-project-hub/
├── apps/
│   └── web/              # Next.js 14 Frontend
├── infra/
│   └── init-db/          # PostgreSQL init scripts
├── docker-compose.yml    # Infrastructure
└── .env                  # Environment variables
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, Tailwind CSS, Shadcn/UI |
| Backend | .NET 8 Web API (coming soon) |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | Microsoft Entra ID |
| Proxy | Nginx Proxy Manager |

## 📋 Features (Planned)

- [ ] Microsoft SSO Login
- [ ] Smart Board (Kanban + Gantt)
- [ ] Teams Integration
- [ ] Outlook Calendar Sync
- [ ] AI Insights (Azure OpenAI)

## 📄 License

Private - All rights reserved.
